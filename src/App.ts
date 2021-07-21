import Crawler from './Crawler';
import Data from './Data';
import Messenger from './Messenger';
import Painter from './Painter';
import {
  asyncForEach,
  dataNamespace,
  findTopComponent,
  findTopInstance,
  getNodeAssignmentData,
  isValidAssignment,
  loadTypefaces,
  resizeGUI,
} from './Tools';
import {
  ASSIGNMENTS,
  DATA_KEYS,
  GUI_CONTENT,
  GUI_SETTINGS,
} from './constants';

/**
 * A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name assemble
 *
 * @param {Object} context The current context (event) received from Figma.
 *
 * @returns {Object} Contains an object with the current page as a javascript object,
 * a messenger instance, and a selection array (if applicable).
 */
const assemble = (context: any = null) => {
  const page = context.currentPage;
  const { selection } = context.currentPage;
  const messenger = new Messenger({ for: context, in: page });

  return {
    messenger,
    page,
    selection,
  };
};

/**
 * Takes a `selection` array and removes any node that is not a
 * text node (`TextNode`), shape node, or a frame variant that does not have an
 * image fill already applied. Excludes shapes smaller than 32 pts to avoid muddying
 * the UI with nodes used in icons.
 *
 * @kind function
 * @name getFilteredNodes
 *
 * @param {Array} selection The resulting array of text nodes.
 *
 * @returns {Array} The resulting array of text nodes.
 */
const getFilteredNodes = (
  selection: Array<any>,
): Array<RealishFilteredNodes> => {
  const consolidatedSelection: Array<SceneNode | PageNode> = selection;

  // retrieve selection of text nodes and filter for unlocked
  const filterTypes: Array<
    ('COMPONENT' | 'ELLIPSE' | 'FRAME' | 'INSTANCE' | 'POLYGON' | 'RECTANGLE' | 'STAR' | 'TEXT')
  > = ['COMPONENT', 'ELLIPSE', 'FRAME', 'INSTANCE', 'POLYGON', 'RECTANGLE', 'STAR', 'TEXT'];
  const typeFilteredNodes: Array<RealishFilteredNodes> = new Crawler(
    { for: consolidatedSelection },
  ).filterByTypes(filterTypes);

  const filteredNodes: Array<RealishFilteredNodes> = [];

  const shapeTypes: Array<
    ('ELLIPSE' | 'POLYGON' | 'RECTANGLE' | 'STAR')
  > = ['ELLIPSE', 'POLYGON', 'RECTANGLE', 'STAR'];
  typeFilteredNodes.forEach((node) => {
    const isNodeAShape: boolean = shapeTypes.includes(
      node.type as 'ELLIPSE' | 'POLYGON' | 'RECTANGLE' | 'STAR',
    );
    // check for Fills; `isArray` check because `fills` can also be a symbol
    const isNodeWithFills: boolean = Array.isArray(node.fills) && (node.fills.length > 0);
    // filter size to exclude icon bits and match to avatars (square/circle)
    const isNodeBigEnough: boolean = (node.width >= 32)
      && (node.height >= 32) && (node.width === node.height);
    const isValidShapeNode: boolean = isNodeAShape && isNodeBigEnough;
    const isValidFillsNode: boolean = isNodeWithFills;

    if (node.type === 'TEXT' || isValidShapeNode) {
      filteredNodes.push(node);
    } else if (isValidFillsNode) {
      // array check to satisfy Typescript (`node.fills` can be either an array or a symbol)
      const nodeFills: Array<Paint> = Array.isArray(node.fills) ? node.fills : null;
      nodeFills.forEach((nodeFill: Paint) => {
        if (nodeFill.type === 'IMAGE') {
          filteredNodes.push(node);
        }
      });
    }
  });
  return filteredNodes;
};

/**
 * Triggers Figma’s change watcher by randomly re-naming a node and then returning
 * it to it’s original name. This is used in the context of applying new data to a main
 * component that needs to be re-published in a library. Data updates do not currently
 * trigger Figma’s awareness of changes within the component.
 *
 * @kind function
 * @name triggerFigmaChangeWatcher
 *
 * @param {Object} node The text node (`TextNode`) to trigger changes on.
 *
 * @returns {null}
 */
const triggerFigmaChangeWatcher = (
  node: RealishFilteredNodes,
): void => {
  // rename the layer, and then rename it back, to trigger Figma's changes watcher
  // this is used to allow main components to be republished with changes
  const randomName: string = `${Date.now()}`;
  const originalName: string = node.name;
  let originalAutoRename: boolean = false;
  if (node.type === 'TEXT') {
    originalAutoRename = node.autoRename;
  }
  /* eslint-disable no-param-reassign */
  node.name = randomName;
  node.name = originalName;

  if (node.type === 'TEXT') {
    node.autoRename = originalAutoRename;
  }
  /* eslint-enable no-param-reassign */

  return null;
};

/**
 * Invokes Figma’s `setRelaunchData` on the passed node and (if applicable),
 * the container component node.
 *
 * @kind function
 * @name setRelaunchCommands
 *
 * @param {Object} node The node (`SceneNode`) to use with `setRelaunchData`.
 *
 * @returns {null}
 */
const setRelaunchCommands = (node: SceneNode): void => {
  node.setRelaunchData({
    'quick-randomize-assigned': GUI_CONTENT.relaunch.layer,
  });

  // apply to instance
  const topInstanceNode: InstanceNode = findTopInstance(node);
  if (topInstanceNode) {
    topInstanceNode.setRelaunchData({
      'quick-randomize-assigned': GUI_CONTENT.relaunch.component,
    });
  }

  // apply to top-level component
  const componentNode: ComponentNode = findTopComponent(node);
  if (componentNode && !componentNode.remote) {
    componentNode.setRelaunchData({
      'quick-randomize-assigned': GUI_CONTENT.relaunch.component,
    });
  }

  // add “Open Realish” to page
  figma.currentPage.setRelaunchData({
    tools: '',
  });

  return null;
};

/**
 * Retrieves all of the typefaces (`FontName`) from a selection of text nodes
 * and returns them as a unique array (without repeats).
 *
 * @kind function
 * @name readTypefaces
 *
 * @param {Array} textNodes Array of the text next (`TextNode`) to retrieve typefaces from.
 *
 * @returns {Array} Returns an array of unique `FontName` entries (no repeats).
 */
const readTypefaces = (textNodes: Array<TextNode>) => {
  const uniqueTypefaces: Array<FontName> = [];

  // take the typeface and, if new/unique, add it to the `uniqueTypefaces` array
  const setTypeFace = (typeface: FontName) => {
    const itemIndex: number = uniqueTypefaces.findIndex(
      (foundItem: FontName) => (
        (foundItem.family === typeface.family)
        && foundItem.style === typeface.style),
    );

    // typeface is not present; add it to the array
    if (itemIndex < 0) {
      uniqueTypefaces.push(typeface);
    }
  };

  // iterate through each text node
  textNodes.forEach((textNode: TextNode) => {
    if (!textNode.hasMissingFont) {
      // some text nodes have multiple typefaces and the API returns a `figma.mixed` Symbol
      if (typeof textNode.fontName !== 'symbol') {
        // if a node does not return `fontName` as a Symbol, we can use the result directly
        const typeface: any = textNode.fontName;
        setTypeFace(typeface);
      } else {
        // use `getRangeFontName` to check each character (based on index) for its typeface
        const { characters } = textNode;
        const length: number = characters.length; // eslint-disable-line prefer-destructuring
        for (let i = 0; i < length; i += 1) {
          const typeface: any = textNode.getRangeFontName(i, i + 1);
          setTypeFace(typeface);
        }
      }
    }
  });

  return uniqueTypefaces;
};

const extractImage = async (
  node: RealishFilteredShapeNodes,
) => {
  let image: Image = null;
  const fills: Array<Paint> = node.fills as Array<Paint>;
  const imageResults: {
    hash: string,
    data: Uint8Array,
  } = {
    hash: null,
    data: null,
  };

  // iterate fills and find an image
  fills.forEach((fill: Paint) => {
    if (fill.type === 'IMAGE') {
      // grab the hash that represent the actual image on disk
      const { imageHash } = fill;
      imageResults.hash = imageHash;
      image = figma.getImageByHash(imageHash);
    }
  });

  if (image) {
    // use the hash to read the image bytes
    imageResults.data = await image.getBytesAsync();
  }

  return imageResults;
};

/**
 * A class to handle core app logic and dispatch work to other classes.
 *
 * @class
 * @name App
 *
 * @property shouldTerminate A boolean that tells us whether or not the GUI should remain open
 * at the end of the plugin’s current task.
 * @property terminatePlugin A convenience function for properly shutting down the plugin.
 */
export default class App {
  shouldTerminate: boolean;
  terminatePlugin: Function;

  constructor({
    shouldTerminate,
    terminatePlugin,
  }) {
    this.shouldTerminate = shouldTerminate;
    this.terminatePlugin = terminatePlugin;
  }

  /**
   * Displays the plugin GUI within Figma.
   *
   * @kind function
   * @name showGUI
   *
   * @param {Object} options Can include `size` calling one of the UI sizes defined
   * in GUI_SETTINGS and/or an initialized instance of the Messenger class for
   * logging (`messenger`). Both are optional.
   * @param {string} options.size An optional string calling one of the UI sizes
   * defined in GUI_SETTINGS (currently `default` or `info`).
   * @param {Object} options.messenger An optional initialized instance of the Messenger class.
   * @param {Function} options.messenger.log The log function from the Messenger class.
   *
   * @returns {null}
   */
  static async showGUI(options: {
    size?: 'default' | 'info',
    messenger?: { log: Function },
  }) {
    const { size, messenger } = options;

    if (messenger) {
      const displayMessage: string = size ? ` at size: ${size}` : '';
      messenger.log(`Display GUI${displayMessage}`);
    }

    // set UI panel size
    if (size) {
      resizeGUI(size, figma.ui);
    }

    // show UI
    figma.ui.show();

    return null;
  }

  /**
   * Triggers a UI refresh and then displays the plugin UI.
   *
   * @kind function
   * @name showToolbar
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   */
  static showToolbar(sessionKey: number) {
    const { messenger } = assemble(figma);

    App.refreshGUI(sessionKey);
    App.showGUI({ messenger });
  }

  /**
   * Triggers a UI refresh with the current selection.
   *
   * @kind function
   * @name refreshGUI
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   */
  static async refreshGUI(sessionKey: number) {
    const { messenger, selection } = assemble(figma);
    const nodes: Array<RealishFilteredNodes> = getFilteredNodes(selection);
    const nodesCount = nodes.length;

    // set array of data with information from each node
    const selected = [];
    await asyncForEach(nodes, async (node) => {
      const assignmentData = getNodeAssignmentData(node);
      let assignment = JSON.parse(assignmentData || null) as RealishAssignment;

      let nodeType: 'shape' | 'text' = 'shape';
      let originalImage: Uint8Array = null;
      let originalText: string = null;
      if (node.type === 'TEXT') {
        nodeType = 'text';
        originalText = node.characters;
      } else {
        const imageResults = await extractImage(node);
        const { data, hash } = imageResults;
        originalImage = data;
        originalText = hash;
      }
      const lockedData = node.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;
      let proposedText: string = nodeType === 'text' ? node.characters : 'original';

      // if text is already assigned, generate/rotate the new proposed text
      if (assignment && (assignment !== 'unassigned')) {
        const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;
        const proposedTextData = node.getSharedPluginData(dataNamespace(), textProposedKey);
        proposedText = JSON.parse(proposedTextData || null);

        if (!locked) {
          if (!proposedText) {
            const data = new Data({ for: node });
            proposedText = data.randomContent();

            // update the proposed text
            node.setSharedPluginData(
              dataNamespace(),
              textProposedKey,
              JSON.stringify(proposedText),
            );
          }

          // ensure shape/text have the correct assignment
          if (nodeType === 'shape') {
            if (
              (assignment !== ASSIGNMENTS.avatarCompany.id)
              && (assignment !== ASSIGNMENTS.avatarCompanyMedia.id)
              && (assignment !== ASSIGNMENTS.avatarEvent.id)
              && (assignment !== ASSIGNMENTS.avatarGroup.id)
              && (assignment !== ASSIGNMENTS.avatarNewsletter.id)
              && (assignment !== ASSIGNMENTS.avatarPerson.id)
              && (assignment !== ASSIGNMENTS.avatarProduct.id)
              && (assignment !== ASSIGNMENTS.avatarSchool.id)
              && (assignment !== ASSIGNMENTS.avatarService.id)
            ) {
              assignment = ASSIGNMENTS.unassigned.id as RealishAssignment;
            }
          } else if (
            (assignment === ASSIGNMENTS.avatarCompany.id)
            || (assignment === ASSIGNMENTS.avatarCompanyMedia.id)
            || (assignment === ASSIGNMENTS.avatarEvent.id)
            || (assignment === ASSIGNMENTS.avatarGroup.id)
            || (assignment === ASSIGNMENTS.avatarNewsletter.id)
            || (assignment === ASSIGNMENTS.avatarPerson.id)
            || (assignment === ASSIGNMENTS.avatarProduct.id)
            || (assignment === ASSIGNMENTS.avatarSchool.id)
            || (assignment === ASSIGNMENTS.avatarService.id)
          ) {
            assignment = ASSIGNMENTS.unassigned.id as RealishAssignment;
          }

          // restore original image
          if (nodeType === 'shape' && proposedText === 'original') {
            proposedText = originalText;
          }
        } else {
          // restore original
          proposedText = originalText;
        }
      } else {
        assignment = ASSIGNMENTS.unassigned.id as RealishAssignment;
      }

      let rounded: 'all' | 'none' | 'some' = 'some';
      if (node.type === 'ELLIPSE') {
        rounded = 'all';
      } else if (
        node.type === 'RECTANGLE'
        || node.type === 'FRAME'
        || node.type === 'COMPONENT'
        || node.type === 'INSTANCE'
      ) {
        if (node.bottomLeftRadius === 0) {
          rounded = 'none';
        } else {
          const { bottomLeftRadius, width } = node;
          if ((bottomLeftRadius / width) >= 0.44) {
            rounded = 'all';
          }
        }
      }

      // update the bundle of info for the current `node` in the selection
      selected.push({
        id: node.id,
        assignment,
        originalImage,
        originalText,
        proposedText,
        nodeType,
        rounded,
        locked,
      });
    });

    // send the updates to the UI
    figma.ui.postMessage({
      action: 'refreshState',
      payload: selected,
    });

    // resize the UI
    let newGUIHeight = GUI_SETTINGS.default.height;
    if (nodesCount > 0) {
      newGUIHeight = ((nodesCount - 1) * 62) + newGUIHeight;
    }

    figma.ui.resize(
      GUI_SETTINGS.default.width,
      newGUIHeight,
    );

    messenger.log(`Updating the UI with ${nodes.length} selected ${nodes.length === 1 ? 'layer' : 'layers'}`);
  }

  /**
   * The core action of the app. Retrieve a node (`SceneNode`) by `id` and lock it
   * (`lock-toggle`), assign it to a specific type (`reassign`), propose new randomized content
   * (`remix`), or restore the proposed content to the node’s original content (`restore`).
   *
   * @kind function
   * @name actOnNode
   *
   * @param {string} actionType The action to take on the node: lock it (`lock-toggle`), assign
   * it to a specific type (`reassign`), propose new randomized content (`remix`), or restore the
   * proposed content to the node’s original content (`restore`).
   * @param {string} payload The `id` of the node to act on and, optionally, the data type to
   * assign the layer to (`assignment`). The `assignment` should match an `id` in the
   * `ASSIGNMENTS` constant.
   * @param {string} payload.id The `id` of the node to act on.
   * @param {string} payload.assignment An optional Realish assignment type.
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static actOnNode(
    actionType: 'lock-toggle' | 'reassign' | 'remix' | 'restore',
    payload: {
      id: string,
      assignment?: RealishAssignment,
    },
    sessionKey: number,
  ) {
    const { id } = payload;
    const { messenger, selection } = assemble(figma);
    const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;

    /**
     * Filters the available `selection` and finds a text node (`TextNode`)
     * matching the `id` provided in the `payload`.
     *
     * @kind function
     * @name retrieveNode
     *
     * @returns {Object} The node (`RealishFilteredNodes`) retrieved.
     */
    const retrieveNode = (): RealishFilteredNodes => {
      const filteredNodes: Array<RealishFilteredNodes> = getFilteredNodes(selection);

      const index = 0;
      const filteredNodesToUpdate: Array<any> = filteredNodes.filter(
        (node) => node.id === id,
      );
      const filteredNodeToUpdate = filteredNodesToUpdate[index];

      return filteredNodeToUpdate;
    };

    /**
     * Assigns or re-assigns a new data assignment type to supplied node (`RealishFilteredNodes`).
     *
     * @kind function
     * @name reassignNode
     *
     * @param {string} nodeToReassign The node to modify.
     */
    const reassignNode = (
      nodeToReassign: RealishFilteredNodes,
    ): void => {
      const { assignment } = payload;
      let nodeType: 'shape' | 'text' = 'shape';
      if (nodeToReassign.type === 'TEXT') {
        nodeType = 'text';
      }

      if (assignment && isValidAssignment(assignment, nodeType)) {
        // commit the new assignment
        nodeToReassign.setSharedPluginData(
          dataNamespace(),
          DATA_KEYS.assignment,
          JSON.stringify(assignment),
        );

        // empty the proposed text
        const proposedText = null;

        // commit the proposed text
        nodeToReassign.setSharedPluginData(
          dataNamespace(),
          textProposedKey,
          JSON.stringify(proposedText),
        );

        // set the re-launch command
        setRelaunchCommands(nodeToReassign);

        triggerFigmaChangeWatcher(nodeToReassign);

        messenger.log(`Updated ${id}’s assignment to: “${assignment}”`);
      } else {
        messenger.log(`Could not reassign ${id}`, 'error');
      }
    };

    /**
     * Sets a new `proposedText` content in a node’s data based on assignment.
     *
     * @kind function
     * @name remixProposedContent
     *
     * @param {string} nodeToRemix The node to modify.
     */
    const remixProposedContent = (
      nodeToRemix: RealishFilteredNodes,
    ): void => {
      // new randomization based on assignment
      const data = new Data({ for: nodeToRemix });
      const proposedText: string = data.randomContent();

      // commit the proposed content
      nodeToRemix.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Remixed ${id}’s proposed content`);
    };

    /**
     * Sets a node’s `proposedText` to it’s current content.
     *
     * @kind function
     * @name restoreContent
     *
     * @param {string} nodeToRestore The node (`RealishFilteredNodes`) to modify.
     */
    const restoreContent = (
      nodeToRestore: RealishFilteredNodes,
    ): void => {
      // set to the current (original) content (or `null` for shapes)
      const proposedText = nodeToRestore.type === 'TEXT' ? nodeToRestore.characters : 'original';
      // commit the proposed content
      nodeToRestore.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Restored ${id} to the original content`);
    };

    /**
     * Locks or unlocks the supplied node for the plugin (not at the Figma level).
     *
     * @kind function
     * @name toggleNodeLock
     *
     * @param {string} nodeToSecure The node to modify.
     * @param {boolean} locked Current locked (`true`) status of the node. Unlocked is `false`.
     */
    const toggleNodeLock = (
      nodeToSecure: RealishFilteredNodes,
      locked: boolean,
    ): void => {
      // commit the new assignment
      nodeToSecure.setSharedPluginData(
        dataNamespace(),
        DATA_KEYS.locked,
        JSON.stringify(!locked), // toggle the opposite of whatever was read from the layer data
      );

      // new randomization based on assignment if layer was previously locked
      // otherwise the proposed content should restore to the original content if locking the layer
      let proposedText: string = nodeToSecure.type === 'TEXT' ? nodeToSecure.characters : 'original';
      if (locked) {
        const data = new Data({ for: nodeToSecure });
        proposedText = data.randomContent();
      }

      // commit the proposed content
      nodeToSecure.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Updated ${id}’s locking to: “${locked}”`);
    };

    const node = retrieveNode();
    if (node) {
      const lockedData = node.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;

      switch (actionType) {
        case 'reassign':
          if (!locked) { reassignNode(node); }
          break;
        case 'remix':
          if (!locked) { remixProposedContent(node); }
          break;
        case 'restore':
          if (!locked) { restoreContent(node); }
          break;
        case 'lock-toggle':
          toggleNodeLock(node, locked);
          break;
        default:
          return null;
      }

      // update the UI
      App.refreshGUI(sessionKey);
    } else {
      messenger.log(`Could not find a TextNode to update with the id: ${id}`, 'error');
    }

    return null;
  }

  /**
   * Sets new `proposedText` on currently selected (and unlocked)
   * text nodes (`TextNode`).
   *
   * @kind function
   * @name remixAll
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {null}
   */
  static remixAll(sessionKey: number): void {
    const { messenger, selection } = assemble(figma);
    const nodes: Array<RealishFilteredNodes> = getFilteredNodes(selection);

    // iterate through each selected layer and apply the `remix` action
    nodes.forEach((
      node: RealishFilteredNodes,
    ) => App.actOnNode('remix', { id: node.id }, sessionKey));

    // reset the working state
    const message: {
      action: string,
    } = {
      action: 'resetState',
    };
    figma.ui.postMessage(message);

    messenger.log('Remix all selected TextNodes');

    return null;
  }

  /**
   * Sets new random content based on a supplied assignment on currently-selected
   * (and unlocked) nodes. A node’s existing `assignment` is ignored. If a node does not already
   * have an assignment, it is assigned the supplied type.
   *
   * @kind function
   * @name quickRandomize
   *
   * @param {string} assignment A string matching an `id` in `ASSIGNMENTS`.
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  async quickRandomize(assignment: string, sessionKey: number) {
    const { messenger, selection } = assemble(figma);
    const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;
    const nodes: Array<RealishFilteredNodes> = getFilteredNodes(selection);

    // iterate through each selected layer and apply the `remix` action
    await asyncForEach(nodes, async (node: RealishFilteredNodes) => {
      const lockedData = node.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;
      let nodeType: 'shape' | 'text' = 'shape';
      if (node.type === 'TEXT') {
        nodeType = 'text';
      }

      if (!locked) {
        if (assignment === 'assigned') {
          App.actOnNode('remix', { id: node.id }, sessionKey);
        } else if (isValidAssignment(assignment, nodeType)) {
          const data = new Data({ for: node });
          const proposedText: string = data.randomContent(assignment);

          // commit the proposed content
          node.setSharedPluginData(
            dataNamespace(),
            textProposedKey,
            JSON.stringify(proposedText),
          );

          messenger.log(`Set ${node.id}’s proposed content for: “${assignment}”`);

          // set the assignment on unassigned nodes, otherwise ignore it
          const currentAssignmentData = getNodeAssignmentData(node);
          const currentAssignment = JSON.parse(currentAssignmentData
            || null) as RealishAssignment;
          if (!currentAssignment || currentAssignment === 'unassigned') {
            const newAssignment: RealishAssignment = assignment as RealishAssignment;
            App.actOnNode('reassign', { id: node.id, assignment: newAssignment }, sessionKey);
          }
        } else {
          messenger.log(`Could not assign ${node.id}; Invalid assignment`, 'error');
        }
      } else {
        messenger.log(`Ignored ${node.id}: locked`);
      }
    });

    messenger.log(`Quickly randomize all selected nodes for ${assignment}`);

    this.commitContent(sessionKey);

    return null;
  }

  /**
   * Assigns (or re-assigns) the current selection with the supplied
   * `assignment` type.
   *
   * @kind function
   * @name quickAssign
   *
   * @param {string} assignment A string matching an `id` in `ASSIGNMENTS`.
   *
   * @returns {Function} Ends with the `closeOrReset` function, terminating the plugin.
   */
  quickAssign(assignment: string): void {
    const { messenger, selection } = assemble(figma);
    const nodes: Array<RealishFilteredNodes> = getFilteredNodes(selection);

    // iterate through each selected layer and apply the `remix` action
    nodes.forEach((node: RealishFilteredNodes) => {
      const lockedData = node.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;
      let nodeType: 'shape' | 'text' = 'shape';
      if (node.type === 'TEXT') {
        nodeType = 'text';
      }

      if (!locked) {
        // set valid shape/test assignments
        let newAssignment: RealishAssignment = assignment as RealishAssignment;
        if (nodeType !== 'text') {
          switch (assignment) {
            case ASSIGNMENTS.name.id:
              newAssignment = ASSIGNMENTS.avatarPerson.id as RealishAssignment;
              break;
            case ASSIGNMENTS.company.id:
              newAssignment = ASSIGNMENTS.avatarCompany.id as RealishAssignment;
              break;
            case ASSIGNMENTS.companyMedia.id:
              newAssignment = ASSIGNMENTS.avatarCompanyMedia.id as RealishAssignment;
              break;
            case ASSIGNMENTS.event.id:
              newAssignment = ASSIGNMENTS.avatarEvent.id as RealishAssignment;
              break;
            case ASSIGNMENTS.group.id:
              newAssignment = ASSIGNMENTS.avatarGroup.id as RealishAssignment;
              break;
            case ASSIGNMENTS.newsletter.id:
              newAssignment = ASSIGNMENTS.avatarNewsletter.id as RealishAssignment;
              break;
            case ASSIGNMENTS.product.id:
              newAssignment = ASSIGNMENTS.avatarProduct.id as RealishAssignment;
              break;
            case ASSIGNMENTS.school.id:
              newAssignment = ASSIGNMENTS.avatarSchool.id as RealishAssignment;
              break;
            case ASSIGNMENTS.service.id:
              newAssignment = ASSIGNMENTS.avatarService.id as RealishAssignment;
              break;
            case ASSIGNMENTS.unassigned.id:
            case ASSIGNMENTS.avatarCompany.id:
            case ASSIGNMENTS.avatarCompanyMedia.id:
            case ASSIGNMENTS.avatarEvent.id:
            case ASSIGNMENTS.avatarGroup.id:
            case ASSIGNMENTS.avatarNewsletter.id:
            case ASSIGNMENTS.avatarPerson.id:
            case ASSIGNMENTS.avatarProduct.id:
            case ASSIGNMENTS.avatarSchool.id:
            case ASSIGNMENTS.avatarService.id:
              // do nothing; valid assignments
              break;
            default:
              newAssignment = null;
              break;
          }
        } else if (
          (assignment === ASSIGNMENTS.avatarCompany.id)
          || (assignment === ASSIGNMENTS.avatarCompanyMedia.id)
          || (assignment === ASSIGNMENTS.avatarEvent.id)
          || (assignment === ASSIGNMENTS.avatarGroup.id)
          || (assignment === ASSIGNMENTS.avatarNewsletter.id)
          || (assignment === ASSIGNMENTS.avatarPerson.id)
          || (assignment === ASSIGNMENTS.avatarProduct.id)
          || (assignment === ASSIGNMENTS.avatarSchool.id)
          || (assignment === ASSIGNMENTS.avatarService.id)
        ) {
          newAssignment = null;
        }

        // commit the new assignment
        let updateCommitted = false;
        if (newAssignment && isValidAssignment(newAssignment, nodeType)) {
          node.setSharedPluginData(
            dataNamespace(),
            DATA_KEYS.assignment,
            JSON.stringify(newAssignment),
          );
          updateCommitted = true;
        }

        // set the re-launch command
        setRelaunchCommands(node);

        triggerFigmaChangeWatcher(node);

        if (newAssignment && updateCommitted) {
          messenger.log(`Updated ${node.id}’s assignment to: “${newAssignment}”`);
        } else {
          messenger.log(`${node.id} could not be assigned to: “${assignment}”`, 'error');
        }
      } else {
        messenger.log(`Ignored ${node.id}: locked`);
      }
    });

    messenger.log(`Quickly reassign all selected TextNodes to: “${assignment}”`);

    // give the user some feedback via toast
    const layerCount = nodes.length;
    if (assignment !== 'unassigned') {
      let assignmentObject = null;
      Object.keys(ASSIGNMENTS).forEach((key) => {
        if (ASSIGNMENTS[key].id === assignment) {
          assignmentObject = ASSIGNMENTS[key];
        }
      });

      messenger.toast(`Layer${layerCount > 1 ? 's were' : ' was'} assigned to: “${assignmentObject.text}” 🥳`);
    } else {
      messenger.toast(`Layer assignment${layerCount > 1 ? 's were' : ' was'} removed 🥳`);
    }

    return this.closeOrReset();
  }

  /**
   * Iterates over the current selection, committing each node’s `proposedText`
   * to `chracters` and updating the node.
   *
   * @kind function
   * @name commitContent
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {Function} Ends with the `closeOrReset` function, terminating the plugin.
   */
  async commitContent(sessionKey: number) {
    const { messenger, selection } = assemble(figma);
    const nodes: Array<RealishFilteredNodes> = getFilteredNodes(selection);

    /**
     * Applies a `Painter` instance to each node in an array, updating the text.
     *
     * @kind function
     * @name manipulateText
     *
     * @param {Array} nodesToPaint The array of text nodes (`TextNode`) to modify.
     */
    const manipulateText = (nodesToPaint) => {
      messenger.log('Begin manipulating text');
      nodesToPaint.forEach((textNode: SceneNode) => {
        // set up Painter instance for the layer
        const painter = new Painter({ node: textNode, sessionKey });

        // replace the existing text with the proposed text
        const paintResult = painter.replaceText();
        messenger.handleResult(paintResult);
      });
      messenger.log('End manipulating text');
    };

    /**
     * Applies a `Painter` instance to each node in an array, updating the shape node.
     * Nodes should be typed as: `RealishFilteredShapeNodes`.
     *
     * @kind function
     * @name manipulateShapes
     *
     * @param {Array} nodesToPaint The array of shape nodes
     * (`RealishFilteredShapeNodes`) to modify.
     */
    const manipulateShapes = async (nodesToPaint) => {
      messenger.log('Begin manipulating shape nodes');

      await asyncForEach(nodesToPaint, async (shapeNode: SceneNode) => {
        // set up Painter instance for the layer
        const painter = new Painter({ node: shapeNode, sessionKey });

        // replace the existing fill with the proposed image fill
        const paintResult = await painter.replaceFill();
        messenger.handleResult(paintResult);
      });
      messenger.log('End manipulating shape nodes');
    };

    // begin main thread of action ------------------------------------------------------

    const textNodes: Array<TextNode> = nodes.filter(
      (node): node is TextNode => node.type === 'TEXT',
    );
    const shapeNodes: Array<RealishFilteredShapeNodes> = nodes.filter(
      (node): node is RealishFilteredShapeNodes => node.type !== 'TEXT',
    );
    const missingTypefaces: Array<TextNode> = textNodes.filter(
      (node: TextNode) => node.hasMissingFont,
    );

    if (
      (textNodes && (textNodes.length > 0) && (missingTypefaces.length < 1))
      || (shapeNodes && (shapeNodes.length > 0))
    ) {
      if (textNodes && (textNodes.length > 0) && (missingTypefaces.length < 1)) {
        // update if text nodes are available and fonts are not missing
        const typefaces: Array<FontName> = readTypefaces(textNodes);
        const languageTypefaces: Array<FontName> = null;

        // load typefaces
        if (languageTypefaces) {
          languageTypefaces.forEach((languageTypeface) => typefaces.push(languageTypeface));
        }
        await loadTypefaces(typefaces, messenger);

        // replace existing text with proposed text
        manipulateText(textNodes);

        // set the re-launch command
        textNodes.forEach((node) => {
          setRelaunchCommands(node);
        });
      }

      // update if shape nodes are available
      if (shapeNodes && (shapeNodes.length > 0)) {
        // update fills on shape layers with proposed images
        await manipulateShapes(shapeNodes);

        // set the re-launch command
        shapeNodes.forEach((node) => {
          setRelaunchCommands(node);
        });
      }

      // update the UI to reflect changes
      App.refreshGUI(sessionKey);

      return this.closeOrReset();
    }

    // otherwise set/display appropriate error messages
    let toastErrorMessage = 'Something went wrong 😬';

    // set the message + log
    if (missingTypefaces.length > 0) {
      toastErrorMessage = nodes.length > 1
        ? '❌ One or more select text layers contain missing fonts'
        : '❌ This text layer contains a missing font';
      messenger.log('Text node(s) contained missing fonts');
    } else {
      toastErrorMessage = '❌ You need to select at least one layer';
      messenger.log('No nodes were selected/found');
    }

    // display the message and terminate the plugin
    messenger.toast(toastErrorMessage);
    return this.closeOrReset();
  }

  /**
   * Resets the plugin GUI back to the original state or closes it entirely,
   * terminating the plugin.
   *
   * @kind function
   * @name closeOrReset
   *
   * @returns {null}
   */
  closeOrReset() {
    if (this.shouldTerminate) {
      return this.terminatePlugin();
    }

    // reset the working state
    const message: {
      action: string,
    } = {
      action: 'resetState',
    };
    figma.ui.postMessage(message);
    return null;
  }
}

import Crawler from './Crawler';
import Data from './Data';
import Messenger from './Messenger';
import Painter from './Painter';
import {
  dataNamespace,
  findTopComponent,
  findTopInstance,
  getNodeAssignmentData,
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
 * @description A shared helper function to set up in-UI messages and the logger.
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
 * @description Takes a `selection` array and removes any node that is not a
 * text node (`TextNode`).
 *
 * @kind function
 * @name filterTextNodes
 *
 * @param {Array} selection The resulting array of text nodes.
 *
 * @returns {Array} The resulting array of text nodes.
 */
const filterTextNodes = (selection: Array<any>): Array<TextNode> => {
  const consolidatedSelection: Array<SceneNode | PageNode> = selection;

  // retrieve selection of text nodes and filter for unlocked
  const textNodes: Array<TextNode> = new Crawler(
    { for: consolidatedSelection },
  ).text();

  return textNodes;
};

/**
 * @description Triggers Figma’s change watcher by randomly re-naming a node and then returning
 * it to it’s original name. This is used in the context of applying new data to a master
 * component that needs to be re-published in a library. Data updates do not currently
 * trigger Figma’s awareness of changes within the component.
 *
 * @kind function
 * @name triggerFigmaChangeWatcher
 *
 * @param {Object} textNode The text node (`TextNode`) to trigger changes on.
 *
 * @returns {null}
 */
const triggerFigmaChangeWatcher = (textNode: TextNode): void => {
  // rename the layer, and then rename it back, to trigger Figma's changes watcher
  // this is used to allow master components to be republished with changes
  const randomName: string = `${Date.now()}`;
  const originalName: string = textNode.name;
  const originalAutoRename: boolean = textNode.autoRename;
  /* eslint-disable no-param-reassign */
  textNode.name = randomName;
  textNode.name = originalName;
  textNode.autoRename = originalAutoRename;
  /* eslint-enable no-param-reassign */

  return null;
};

/**
 * @description Invokes Figma’s `setRelaunchData` on the passed node and (if applicable),
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
  const topInstanceNode: InstanceNode = findTopInstance(node);

  // currently cannot apply `setRelaunchData` to a node inside of an `InstanceNode`
  if (!topInstanceNode) {
    node.setRelaunchData({
      'quick-randomize-assigned': GUI_CONTENT.relaunch.layer,
    });
  }

  // apply to top-level component
  const componentNode: ComponentNode = findTopComponent(node);
  if (componentNode && !componentNode.remote) {
    componentNode.setRelaunchData({
      'quick-randomize-assigned': GUI_CONTENT.relaunch.component,
    });
  }

  // apply to the instance node
  // (currently not possible - but coming soon)
  // if (topInstanceNode) {
  //   topInstanceNode.setRelaunchData({
  //     'quick-randomize-assigned': GUI_CONTENT.relaunch.component,
  //   });

  //   if (topInstanceNode.masterComponent && !topInstanceNode.masterComponent.remote) {
  //     topInstanceNode.masterComponent.setRelaunchData({
  //       'quick-randomize-assigned': GUI_CONTENT.relaunch.component,
  //     });
  //   }
  // }

  return null;
};

/**
 * @description Retrieves all of the typefaces (`FontName`) from a selection of text nodes
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

/**
 * @description A class to handle core app logic and dispatch work to other classes.
 *
 * @class
 * @name App
 *
 * @constructor
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
   * @description Displays the plugin GUI within Figma.
   *
   * @kind function
   * @name showGUI
   *
   * @param {Object} options Can include `size` calling one of the UI sizes defined
   * in GUI_SETTINGS  and/or an initialized instance of the Messenger class for
   * logging (`messenger`). Both are optional.
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
   * @description Triggers a UI refresh and then displays the plugin UI.
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
   * @description Triggers a UI refresh with the current selection.
   *
   * @kind function
   * @name refreshGUI
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   */
  static refreshGUI(sessionKey: number) {
    const { messenger, selection } = assemble(figma);
    const textNodes: Array<TextNode> = filterTextNodes(selection);
    const textNodesCount = textNodes.length;

    // set array of data with information from each text node
    const selected = [];
    textNodes.forEach((textNode: TextNode) => {
      const assignmentData = getNodeAssignmentData(textNode);
      let assignment: string = JSON.parse(assignmentData || null);
      let proposedText: string = textNode.characters;
      const lockedData = textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;

      // if text is already assigned, generate/rotate the new proposed text
      if (assignment && (assignment !== 'unassigned')) {
        const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;
        const proposedTextData = textNode.getSharedPluginData(dataNamespace(), textProposedKey);

        if (!locked) {
          proposedText = JSON.parse(proposedTextData || null);
          if (!proposedText) {
            const data = new Data({ for: textNode });
            proposedText = data.randomText();

            // update the proposed text
            textNode.setSharedPluginData(
              dataNamespace(),
              textProposedKey,
              JSON.stringify(proposedText),
            );
          }
        }
      } else {
        assignment = ASSIGNMENTS.unassigned.id;
      }

      // update the bundle of info for the current `textNode` in the selection
      selected.push({
        id: textNode.id,
        assignment,
        originalText: textNode.characters,
        proposedText,
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
    if (textNodesCount > 0) {
      newGUIHeight = ((textNodesCount - 1) * 62) + newGUIHeight;
    }

    figma.ui.resize(
      GUI_SETTINGS.default.width,
      newGUIHeight,
    );

    messenger.log(`Updating the UI with ${textNodes.length} selected ${textNodes.length === 1 ? 'layer' : 'layers'}`);
  }

  /**
   * @description The core action of the app. Retrieve a text node (`TextNode`) by `id` and
   * lock it (`lock-toggle`), assign it to a specific type (`reassign`), propose new randomized
   * text (`remix`), or restore the proposed text to the node’s original text (`restore`).
   *
   * @kind function
   * @name actOnNode
   *
   * @param {string} actionType The action to take on the node: lock it (`lock-toggle`), assign
   * it to a specific type (`reassign`), propose new randomized text (`remix`), or restore the
   * proposed text to the node’s original text (`restore`).
   * @param {string} payload The `id` of the node to act on and, optionally, the data type to
   * assign the layer to (`assignment`). The `assignment` should match an `id` in the
   * `ASSIGNMENTS` constant.
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static actOnNode(
    actionType: 'lock-toggle' | 'reassign' | 'remix' | 'restore',
    payload: {
      id: string,
      assignment?:
        'unassigned'
        | 'name'
        | 'company'
        | 'country'
        | 'date'
        | 'degree-badge'
        | 'domain'
        | 'email'
        | 'job-title'
        | 'timestamp',
    },
    sessionKey: number,
  ) {
    const { id } = payload;
    const { messenger, selection } = assemble(figma);
    const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;

    /**
     * @description Filters the available `selection` and finds a text node (`TextNode`)
     * matching the `id` provided in the `payload`.
     *
     * @kind function
     * @name retrieveTextNode
     *
     * @returns {Object} The text node (`TextNode`) retrieved.
     */
    const retrieveTextNode = (): TextNode => {
      const textNodes: Array<TextNode> = filterTextNodes(selection);

      const index = 0;
      const textNodesToUpdate: Array<TextNode> = textNodes.filter(
        (node: TextNode) => node.id === id,
      );
      const textNodeToUpdate: TextNode = textNodesToUpdate[index];

      return textNodeToUpdate;
    };

    /**
     * @description Assigns or re-assigns a new data assignment type to supplied
     * text node (`TextNode`).
     *
     * @kind function
     * @name reassignTextNode
     *
     * @param {string} textNodeToReassign The text node (`TextNode`) to modify.
     */
    const reassignTextNode = (textNodeToReassign: TextNode): void => {
      const { assignment } = payload;

      if (assignment) {
        // commit the new assignment
        textNodeToReassign.setSharedPluginData(
          dataNamespace(),
          DATA_KEYS.assignment,
          JSON.stringify(assignment),
        );

        // empty the proposed text
        const proposedText = null;

        // commit the proposed text
        textNodeToReassign.setSharedPluginData(
          dataNamespace(),
          textProposedKey,
          JSON.stringify(proposedText),
        );

        // set the re-launch command
        setRelaunchCommands(textNodeToReassign);

        triggerFigmaChangeWatcher(textNodeToReassign);

        messenger.log(`Updated ${id}’s assignment to: “${assignment}”`);
      }
    };

    /**
     * @description Sets a new `proposedText` in a node’s data based on assignment.
     *
     * @kind function
     * @name remixProposedText
     *
     * @param {string} textNodeToRemix The text node (`TextNode`) to modify.
     */
    const remixProposedText = (textNodeToRemix: TextNode): void => {
      // new randomization based on assignment
      const data = new Data({ for: textNodeToRemix });
      const proposedText: string = data.randomText();

      // commit the proposed text
      textNodeToRemix.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Remixed ${id}’s proposed text`);
    };

    /**
     * @description Sets a text node’s (`TextNode`) `proposedText` to it’s
     * current text (`characters`).
     *
     * @kind function
     * @name restoreText
     *
     * @param {string} textNodeToRestore The text node (`TextNode`) to modify.
     */
    const restoreText = (textNodeToRestore: TextNode): void => {
      // set to the current (original) text
      const proposedText = textNodeToRestore.characters;

      // commit the proposed text
      textNodeToRestore.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Restored ${id} to the original text`);
    };

    /**
     * @description Locks or unlocks the supplied text node (`TextNode`) for the plugin
     * not at the Figma level.
     *
     * @kind function
     * @name toggleNodeLock
     *
     * @param {string} textNodeToSecure The text node (`TextNode`) to modify.
     * @param {boolean} locked Current locked (`true`) status of the node. Unlocked is `false`.
     */
    const toggleNodeLock = (
      textNodeToSecure: TextNode,
      locked: boolean,
    ): void => {
      // commit the new assignment
      textNodeToSecure.setSharedPluginData(
        dataNamespace(),
        DATA_KEYS.locked,
        JSON.stringify(!locked), // toggle the opposite of whatever was read from the layer data
      );

      // new randomization based on assignment if layer was previously locked
      // otherwise the proposed text should restore to the original text if locking the layer
      let proposedText: string = textNodeToSecure.characters;
      if (locked) {
        const data = new Data({ for: textNodeToSecure });
        proposedText = data.randomText();
      }

      // commit the proposed text
      textNodeToSecure.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Updated ${id}’s locking to: “${locked}”`);
    };

    const textNode = retrieveTextNode();
    if (textNode) {
      const lockedData = textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;

      switch (actionType) {
        case 'reassign':
          if (!locked) { reassignTextNode(textNode); }
          break;
        case 'remix':
          if (!locked) { remixProposedText(textNode); }
          break;
        case 'restore':
          if (!locked) { restoreText(textNode); }
          break;
        case 'lock-toggle':
          toggleNodeLock(textNode, locked);
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
   * @description Sets new `proposedText` on currently selected (and unlocked)
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
    const textNodes: Array<TextNode> = filterTextNodes(selection);

    // iterate through each selected layer and apply the `remix` action
    textNodes.forEach((textNode: TextNode) => App.actOnNode('remix', { id: textNode.id }, sessionKey));

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
   * @description Sets new random text based on a supplied assignment on currently-selected
   * (and unlocked) text nodes (`TextNode`). A node’s existing `assignment` is ignored. If
   * a node does not already have an assignment, it is assigned the supplied type.
   *
   * @kind function
   * @name quickRandomize
   *
   * @param {string} assignment A string matching an `id` in `ASSIGNMENTS`.
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  quickRandomize(assignment: string, sessionKey: number): void {
    const { messenger, selection } = assemble(figma);
    const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;
    const textNodes: Array<TextNode> = filterTextNodes(selection);

    // iterate through each selected layer and apply the `remix` action
    textNodes.forEach((textNode: TextNode) => {
      const lockedData = textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;

      if (!locked) {
        if (assignment === 'assigned') {
          App.actOnNode('remix', { id: textNode.id }, sessionKey);
        } else {
          const data = new Data({ for: textNode });
          const proposedText: string = data.randomText(assignment);

          // commit the proposed text
          textNode.setSharedPluginData(
            dataNamespace(),
            textProposedKey,
            JSON.stringify(proposedText),
          );

          messenger.log(`Set ${textNode.id}’s proposed text for: “${assignment}”`);

          // set the assignment on unassigned nodes, otherwise ignore it
          type Assignment =
            'unassigned'
            | 'name'
            | 'company'
            | 'country'
            | 'date'
            | 'degree-badge'
            | 'domain'
            | 'email'
            | 'job-title'
            | 'timestamp';
          const currentAssignmentData = getNodeAssignmentData(textNode);
          const currentAssignment = JSON.parse(currentAssignmentData || null) as Assignment;
          if (!currentAssignment || currentAssignment === 'unassigned') {
            const newAssignment: Assignment = assignment as Assignment;
            App.actOnNode('reassign', { id: textNode.id, assignment: newAssignment }, sessionKey);
          }
        }
      } else {
        messenger.log(`Ignored ${textNode.id}: locked`);
      }
    });

    messenger.log(`Quickly randomize all selected TextNodes for ${assignment}`);

    this.commitText(sessionKey);

    return null;
  }

  /**
   * @description Assigns (or re-assigns) the current selection with the supplied
   * `assignment` type.
   *
   * @kind function
   * @name quickRandomize
   *
   * @param {string} assignment A string matching an `id` in `ASSIGNMENTS`.
   *
   * @returns {Function} Ends with the `closeOrReset` function, terminating the plugin.
   */
  quickAssign(assignment: string): void {
    const { messenger, selection } = assemble(figma);
    const textNodes: Array<TextNode> = filterTextNodes(selection);

    // iterate through each selected layer and apply the `remix` action
    textNodes.forEach((textNode: TextNode) => {
      const lockedData = textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
      const locked: boolean = lockedData ? JSON.parse(lockedData) : false;

      if (!locked) {
        // commit the new assignment
        textNode.setSharedPluginData(
          dataNamespace(),
          DATA_KEYS.assignment,
          JSON.stringify(assignment),
        );

        // set the re-launch command
        setRelaunchCommands(textNode);

        triggerFigmaChangeWatcher(textNode);

        messenger.log(`Updated ${textNode.id}’s assignment to: “${assignment}”`);
      } else {
        messenger.log(`Ignored ${textNode.id}: locked`);
      }
    });

    messenger.log(`Quickly reassign all selected TextNodes to: “${assignment}”`);

    // give the user some feedback via toast
    const layerCount = textNodes.length;
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
   * @description Iterates over the current selection, committing each node’s `proposedText`
   * to `chracters` and updating the node.
   *
   * @kind function
   * @name commitText
   *
   * @param {string} sessionKey A rotating key used during the single run of the plugin.
   *
   * @returns {Function} Ends with the `closeOrReset` function, terminating the plugin.
   */
  async commitText(sessionKey: number) {
    const { messenger, selection } = assemble(figma);
    const textNodes: Array<TextNode> = filterTextNodes(selection);

    /**
     * @description Applies a `Painter` instance to each node in an array, updating the text.
     *
     * @kind function
     * @name manipulateText
     *
     * @param {Array} textNodesToPaint The array of text nodes (`TextNode`) to modify.
     */
    const manipulateText = (textNodesToPaint) => {
      messenger.log('Begin manipulating text');
      textNodesToPaint.forEach((textNode: SceneNode) => {
        // set up Painter instance for the layer
        const painter = new Painter({ node: textNode, sessionKey });

        // replace the existing text with the proposed text
        const paintResult = painter.replaceText();
        messenger.handleResult(paintResult);
      });
      messenger.log('End manipulating text');
    };

    // begin main thread of action ------------------------------------------------------

    // translate if text nodes are available and fonts are not missing
    const missingTypefaces: Array<TextNode> = textNodes.filter(
      (node: TextNode) => node.hasMissingFont,
    );
    if ((textNodes.length > 0) && (missingTypefaces.length < 1)) {
      // run the main thread this sets everything else in motion
      const typefaces: Array<FontName> = readTypefaces(textNodes);
      const languageTypefaces: Array<FontName> = null;

      // load typefaces
      if (languageTypefaces) {
        languageTypefaces.forEach(languageTypeface => typefaces.push(languageTypeface));
      }
      await loadTypefaces(typefaces, messenger);

      // replace existing text with proposed text
      manipulateText(textNodes);

      // update the UI to reflect changes
      App.refreshGUI(sessionKey);

      return this.closeOrReset();
    }

    // otherwise set/display appropriate error messages
    let toastErrorMessage = 'Something went wrong 😬';

    // set the message + log
    if (missingTypefaces.length > 0) {
      toastErrorMessage = textNodes.length > 1
        ? '❌ One or more select text layers contain missing fonts'
        : '❌ This text layer contains a missing font';
      messenger.log('Text node(s) contained missing fonts');
    } else {
      toastErrorMessage = '❌ You need to select at least one text layer';
      messenger.log('No text nodes were selected/found');
    }

    // display the message and terminate the plugin
    messenger.toast(toastErrorMessage);
    return this.closeOrReset();
  }

  /**
   * @description Resets the plugin GUI back to the original state or closes it entirely,
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

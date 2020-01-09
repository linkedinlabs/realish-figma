import Crawler from './Crawler';
import Messenger from './Messenger';
// import Painter from './Painter';
import {
  dataNamespace,
  // loadTypefaces,
  resizeGUI,
} from './Tools';
import {
  ASSIGNMENTS,
  DATA_KEYS,
  GUI_SETTINGS,
} from './constants';

const Generator = require('unique-names-generator'); // temp

/**
 * @description A shared helper function to set up in-UI messages and the logger.
 *
 * @kind function
 * @name assemble
 * @param {Object} context The current context (event) received from Figma.
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

// /**
//  * @description Retrieves all of the typefaces (`FontName`) from a selection of text nodes
//  * and returns them as a unique array (without repeats).
//  *
//  * @kind function
//  * @name readTypefaces
//  *
//  * @param {Array} textNodes Array of the text next (`TextNode`) to retrieve typefaces from.
//  *
//  * @returns {Array} Returns an array of unique `FontName` entries (no repeats).
//  */
// const readTypefaces = (textNodes: Array<TextNode>) => {
//   const uniqueTypefaces: Array<FontName> = [];

//   // take the typeface and, if new/unique, add it to the `uniqueTypefaces` array
//   const setTypeFace = (typeface: FontName) => {
//     const itemIndex: number = uniqueTypefaces.findIndex(
//       (foundItem: FontName) => (
//         (foundItem.family === typeface.family)
//         && foundItem.style === typeface.style),
//     );

//     // typeface is not present; add it to the array
//     if (itemIndex < 0) {
//       uniqueTypefaces.push(typeface);
//     }
//   };

//   // iterate through each text node
//   textNodes.forEach((textNode: TextNode) => {
//     if (!textNode.hasMissingFont) {
//       // some text nodes have multiple typefaces and the API returns a `figma.mixed` Symbol
//       if (typeof textNode.fontName !== 'symbol') {
//         // if a node does not return `fontName` as a Symbol, we can use the result directly
//         const typeface: any = textNode.fontName;
//         setTypeFace(typeface);
//       } else {
//         // use `getRangeFontName` to check each character (based on index) for its typeface
//         const { characters } = textNode;
//         const length: number = characters.length; // eslint-disable-line prefer-destructuring
//         for (let i = 0; i < length; i += 1) {
//           const typeface: any = textNode.getRangeFontName(i, i + 1);
//           setTypeFace(typeface);
//         }
//       }
//     }
//   });

//   return uniqueTypefaces;
// };

const generateRandomName = () => {
  const { uniqueNamesGenerator, names } = Generator; // temp
  const capitalizedName: string = uniqueNamesGenerator({
    dictionaries: [names, names],
    separator: ' ',
    length: 2,
    style: 'capital',
  });

  return capitalizedName;
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

  /** WIP
   * @description Enables the plugin GUI within Figma.
   *
   * @kind function
   * @name showGUI
   * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
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

  /** WIP
   * @description Enables the plugin GUI within Figma.
   *
   * @kind function
   * @name showToolbar
   * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static showToolbar(sessionKey: number) {
    const { messenger } = assemble(figma);

    App.refreshGUI(sessionKey);
    App.showGUI({ messenger });
  }

  /** WIP
   * @description Does a thing.
   *
   * @kind function
   * @name refreshGUI
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static refreshGUI(sessionKey: number) {
    const { messenger, selection } = assemble(figma);

    const observeLocked: boolean = true;
    const consolidatedSelection: Array<SceneNode | PageNode> = selection;

    // retrieve selection of text nodes and filter for locked/unlocked based on options
    const textNodes = new Crawler({ for: consolidatedSelection }).text(observeLocked);
    const textNodesCount = textNodes.length;

    const selected = [];
    textNodes.forEach((textNode) => {
      const assignmentData = textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.assignment);
      let assignment: string = JSON.parse(assignmentData || null);
      let proposedText: string = textNode.characters;

      // if text is already assigned, generate/rotate the new proposed text
      if (assignment && (assignment !== 'unassigned')) {
        const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;
        const proposedTextData = textNode.getSharedPluginData(dataNamespace(), textProposedKey);

        proposedText = JSON.parse(proposedTextData || null);
        if (!proposedText) {
          proposedText = generateRandomName();

          // update the proposed text
          textNode.setSharedPluginData(
            dataNamespace(),
            textProposedKey,
            JSON.stringify(proposedText),
          );
        }
      } else {
        assignment = ASSIGNMENTS.unassigned;
      }

      // update the bundle of info for the current `textNode` in the selection
      selected.push({
        id: textNode.id,
        assignment,
        originalText: textNode.characters,
        proposedText,
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

  /** WIP
   * @description Enables the plugin GUI within Figma.
   *
   * @kind function
   * @name actOnNode
   * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static actOnNode(
    actionType: 'reassign' | 'remix' | 'restore',
    payload: {
      id: string,
      assignment?: 'unassigned' | 'name' | 'not-name',
    },
    sessionKey: number,
  ) {
    const { id } = payload;
    const { messenger, selection } = assemble(figma);
    const textProposedKey: string = `${DATA_KEYS.textProposed}-${sessionKey}`;

    /** WIP
     * @description Enables the plugin GUI within Figma.
     *
     * @kind function
     * @name retrieveTextNode
     * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
     *
     * @returns {null} Shows a Toast in the UI if nothing is selected.
     */
    const retrieveTextNode = (): TextNode => {
      const observeLocked: boolean = true;
      const consolidatedSelection: Array<SceneNode | PageNode> = selection;

      const textNodes = new Crawler({ for: consolidatedSelection }).text(observeLocked);

      const index = 0;
      const textNodesToUpdate: Array<TextNode> = textNodes.filter(
        (node: TextNode) => node.id === id,
      );
      const textNodeToUpdate: TextNode = textNodesToUpdate[index];

      return textNodeToUpdate;
    };

    /** WIP
     * @description Enables the plugin GUI within Figma.
     *
     * @kind function
     * @name reassignTextNode
     * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
     *
     * @returns {null} Shows a Toast in the UI if nothing is selected.
     */
    const reassignTextNode = (textNodeToReassign): void => {
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

        messenger.log(`Updated ${id}’s assignment to: “${assignment}”`);
      }
    };

    /** WIP
     * @description Enables the plugin GUI within Figma.
     *
     * @kind function
     * @name remixProposedText
     * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
     *
     * @returns {null} Shows a Toast in the UI if nothing is selected.
     */
    const remixProposedText = (textNodeToRemix): void => {
      // new randomization based on assignment
      const proposedText = generateRandomName();

      // commit the proposed text
      textNodeToRemix.setSharedPluginData(
        dataNamespace(),
        textProposedKey,
        JSON.stringify(proposedText),
      );

      messenger.log(`Remixed ${id}’s proposed text`);
    };

    /** WIP
     * @description Enables the plugin GUI within Figma.
     *
     * @kind function
     * @name restoreText
     * @param {string} size An optional param calling one of the UI sizes defined in GUI_SETTINGS.
     *
     * @returns {null} Shows a Toast in the UI if nothing is selected.
     */
    const restoreText = (textNodeToRestore): void => {
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

    const textNode = retrieveTextNode();
    if (textNode) {
      switch (actionType) {
        case 'reassign':
          reassignTextNode(textNode);
          break;
        case 'remix':
          remixProposedText(textNode);
          break;
        case 'restore':
          restoreText(textNode);
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

  /** WIP
   * @description Does a thing.
   *
   * @kind function
   * @name commitText
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  async commitText(
    options: {
      languages: Array<string>,
      action: 'duplicate' | 'replace' | 'new-page',
      translateLocked: boolean,
    },
    savePrefs: boolean,
  ) {
    // const {
    //   messenger,
    //   page,
    //   selection,
    // } = assemble(figma);
    // const {
    //   action,
    //   languages,
    //   translateLocked,
    // } = options;
    // let consolidatedSelection: Array<SceneNode | PageNode> = selection;

    // // retrieve selection of text nodes and filter for locked/unlocked based on options
    // let textNodes = new Crawler({ for: consolidatedSelection }).text(translateLocked);

    // /** WIP
    //  * @description Does a thing.
    //  *
    //  * @kind function
    //  * @name manipulateText
    //  *
    //  * @returns {null} Shows a Toast in the UI if nothing is selected.
    //  */
    // const manipulateText = (textNodesToPaint) => {
    //   messenger.log('Begin manipulating text');
    //   textNodesToPaint.forEach((textNode: SceneNode) => {
    //     // set up Painter instance for the layer
    //     // const painter = new Painter({ for: textNode, in: page });

    //     // replace the existing text with the translation
    //     // TKTK handle error result
    //     // painter.replaceText();
    //     messenger.toast('Do a thing!');
    //   });
    //   messenger.log('End manipulating text');
    // };

    /**
     * @description Resets the plugin GUI back to the original state or closes it entirely,
     * terminating the plugin.
     *
     * @kind function
     * @name closeOrReset
     *
     * @returns {null}
     */
    const closeOrReset = () => {
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
    };

    // begin main thread of action ------------------------------------------------------

    // save current options
    if (savePrefs) {
      figma.clientStorage.setAsync(DATA_KEYS.options, options);
    }

    // // if action is `new-page`, need to create a new page first
    // let newPage = null;
    // if (textNodes.length > 0 && action === 'new-page') {
    //   newPage = figma.createPage();
    // }

    // // if action is `duplicate`, need to duplicate the layers first
    // if (
    //   textNodes.length > 0
    //   && (action === 'duplicate' || action === 'new-page')
    // ) {
    //   consolidatedSelection = [];

    //   selection.forEach((node) => {
    //     messenger.log('Do a thing!')
    //     messenger.toast('Do a thing!')
    //     // set up Painter instance for the layer
    //     // const painter = new Painter({ for: node, in: page });

    //     // duplicate the layer
    //     // const newNodeResult = painter.duplicate(newPage);
    //     // if (newNodeResult.status === 'success') {
    //     //   const newNode = newNodeResult.node;
    //     //   consolidatedSelection.push(newNode);
    //     // }
    //   });

    //   if (newPage && action === 'new-page') {
    //     figma.currentPage = newPage;
    //     figma.currentPage.selection = newPage.children;
    //   }

    //   // reset and retrieve selection of text nodes
    //   textNodes = new Crawler({ for: consolidatedSelection }).text(translateLocked);
    // }

    // // translate if text nodes are available and fonts are not missing
    // const missingTypefaces: Array<TextNode> = textNodes.filter(
    //   (node: TextNode) => node.hasMissingFont,
    // );
    // if ((textNodes.length > 0) && (missingTypefaces.length < 1)) {
    //   // run the main thread this sets everything else in motion
    //   const typefaces: Array<FontName> = readTypefaces(textNodes);
    //   const languageTypefaces: Array<FontName> = null;

    //   // load typefaces
    //   if (languageTypefaces) {
    //     languageTypefaces.forEach(languageTypeface => typefaces.push(languageTypeface));
    //   }
    //   await loadTypefaces(typefaces, messenger);

    //   // do the text stuff TKTK

    //   return closeOrReset();
    // }

    // // otherwise set/display appropriate error messages
    // let toastErrorMessage = 'Something went wrong 😬';

    // // set the message + log
    // if (missingTypefaces.length > 0) {
    //   toastErrorMessage = textNodes.length > 1
    //     ? '❌ One or more select text layers contain missing fonts'
    //     : '❌ This text layer contains a missing font';
    //   messenger.log('Text node(s) contained missing fonts');
    // } else {
    //   toastErrorMessage = translateLocked
    //     ? '❌ You need to select at least one text layer'
    //     : '❌ You need to select at least one unlocked text layer';
    //   messenger.log('No text nodes were selected/found');
    // }

    // // display the message and terminate the plugin
    // messenger.toast(toastErrorMessage);
    return closeOrReset();
  }
}

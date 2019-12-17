import Crawler from './Crawler';
import Messenger from './Messenger';
// import Painter from './Painter';
import {
  awaitUIReadiness,
  // loadTypefaces,
  resizeGUI,
} from './Tools';
import { DATA_KEYS } from './constants';

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
    size: 'default' | 'info',
    messenger?: { log: Function },
  }) {
    const { size, messenger } = options;

    if (messenger) {
      messenger.log(`Display GUI at size: ${size}`);
    }

    if (size === 'default') {
      // retrieve existing options
      const lastUsedOptions: {
        action: 'duplicate' | 'replace' | 'new-page',
        translateLocked: boolean,
        languages: Array<string>,
      } = await figma.clientStorage.getAsync(DATA_KEYS.options);

      // update the UI with the existing options
      if (lastUsedOptions
        && lastUsedOptions.action !== undefined
        && lastUsedOptions.translateLocked !== undefined
        && lastUsedOptions.languages !== undefined
      ) {
        // set the options in the UI
        figma.ui.postMessage({
          action: 'setOptions',
          payload: lastUsedOptions,
        });

        // wait for the UI to tell us it is done setting options
        // this prevents showing the UI while changes are being drawn
        await awaitUIReadiness(messenger);
      }
    }

    // set UI panel size
    resizeGUI(size, figma.ui);

    // show UI
    figma.ui.show();

    return null;
  }

  static showToolbar() {
    const { messenger } = assemble(figma);

    App.refreshGUI();
    App.showGUI({ size: 'default', messenger });
  }

  /** WIP
   * @description Does a thing.
   *
   * @kind function
   * @name refreshGUI
   *
   * @returns {null} Shows a Toast in the UI if nothing is selected.
   */
  static refreshGUI() {
    const { messenger, selection } = assemble(figma);

    const observeLocked: boolean = true;
    const consolidatedSelection: Array<SceneNode | PageNode> = selection;

    // retrieve selection of text nodes and filter for locked/unlocked based on options
    const textNodes = new Crawler({ for: consolidatedSelection }).text(observeLocked);

    const selected = [];
    textNodes.forEach((textNode) => {
      selected.push({
        id: textNode.id,
        originalText: textNode.characters,
        newText: textNode.characters,
      });
    });

    // send the updates to the UI
    figma.ui.postMessage({
      action: 'refreshState',
      payload: selected,
    });

    messenger.log(`Updating the UI with ${textNodes.length} selected ${textNodes.length === 1 ? 'layer' : 'layers'}`);
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

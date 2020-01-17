// ++++++++++++++++++++++++++ Specter for Figma +++++++++++++++++++++++++++
import App from './App';
import Messenger from './Messenger';
import { awaitUIReadiness } from './Tools';
import { ASSIGNMENTS } from './constants';

// GUI management -------------------------------------------------

/**
 * @description Shuts down the plugin and closes the GUI.
 *
 * @kind function
 * @name terminatePlugin
 *
 * @returns {null}
 */
const terminatePlugin = (): void => {
  // close the plugin without suppressing error messages
  figma.closePlugin();
  return null;
};

// watch for commands -------------------------------------------------

/**
 * @description Takes a unique string (`type`) and calls the corresponding action
 * in the App class. Also does some housekeeping duties such as pre-loading typefaces
 * and managing the GUI.
 *
 * @kind function
 * @name dispatcher
 * @param {Object} action An object comprised of `type`, a string representing
 * the action received from the GUI and `visual` a boolean indicating if the
 * command came from the GUI or the menu.
 * @returns {null}
 */
const dispatcher = async (action: {
  type: string,
  payload?: any,
  visual: boolean,
  sessionKey: number,
}) => {
  const {
    payload,
    sessionKey,
    type,
    visual,
  } = action;

  // if the action is not visual, close the plugin after running
  const shouldTerminate: boolean = !visual;

  // pass along some GUI management and navigation functions to the App class
  const app = new App({
    shouldTerminate,
    terminatePlugin,
  });

  // run the action in the App class based on type
  const runAction = async () => {
    // retrieve existing options
    // const lastUsedOptions: {
    //   action: 'duplicate' | 'replace' | 'new-page',
    //   translateLocked: boolean,
    //   languages: Array<string>,
    // } = await figma.clientStorage.getAsync(DATA_KEYS.options);

    // make sure the type passed from the menu command exists
    const verifyQuickType = (kind: string, quickType: string): boolean => {
      const typeSimplified = quickType.replace(`quick-${kind}-`, '');
      let isVerified = false;
      if (typeSimplified && Object.values(ASSIGNMENTS).includes(typeSimplified)) {
        isVerified = true;
      }
      return isVerified;
    };

    switch (type) {
      case 'lock-toggle':
      case 'reassign':
      case 'remix':
      case 'restore':
        App.actOnNode(type, payload, sessionKey);
        break;
      case 'remix-all':
        App.remixAll(sessionKey);
        break;
      case 'submit':
        app.commitText(sessionKey);
        break;
      case 'tools':
        App.showToolbar(sessionKey);
        break;
      case String(type.match(/^quick-randomize-.*/)):
        if (verifyQuickType('randomize', type)) {
          app.quickRandomize(type.replace('quick-randomize-', ''), sessionKey);
        }
        break;
      case String(type.match(/^quick-assign-.*/)):
        if (verifyQuickType('assign', type)) {
          app.quickAssign(type.replace('quick-assign-', ''));
        }
        break;
      default:
        return null;
    }

    return null;
  };

  runAction();

  return null;
};
export default dispatcher;

/**
 * @description Acts as the main wrapper function for the plugin. Run by default
 * when Figma calls the plugin.
 *
 * @kind function
 * @name main
 *
 * @returns {null}
 */
const main = async () => {
  // set up rotating key (use a timestamp)
  // this key is only used during the single run of the plugin
  const SESSION_KEY: number = Math.round((new Date()).getTime() / 1000);

  // set up logging
  const messenger = new Messenger({ for: figma, in: figma.currentPage });

  // set up the UI, hidden by default -----------------------------------------
  figma.showUI(__html__, { visible: false }); // eslint-disable-line no-undef

  // make sure UI has finished setting up
  await awaitUIReadiness(messenger);

  // watch menu commands ------------------------------------------------------
  if (figma.command) {
    dispatcher({
      type: figma.command,
      visual: false,
      sessionKey: SESSION_KEY,
    });
  }

  // watch GUI action clicks --------------------------------------------------
  figma.ui.onmessage = (msg: { action: string, payload: any }): void => {
    const { action, payload } = msg;

    // watch for actions and send to `dispatcher`
    if (action) {
      dispatcher({
        type: action,
        payload,
        visual: true,
        sessionKey: SESSION_KEY,
      });
    }

    // ignore everything else
    return null;
  };

  // watch selection changes on the Figma level -------------------------------
  figma.on('selectionchange', () => {
    App.refreshGUI(SESSION_KEY);
  });
};

// run main as default
main();

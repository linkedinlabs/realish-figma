/**
 * @description A set of functions to operate the plugin GUI.
 */
import './assets/css/main.scss';
import './vendor/figma-select-menu';
import { ASSIGNMENTS } from './constants';

/**
 * @description Sends a message and applicable payload to the main thread.
 *
 * @kind function
 * @name sendMsgToMain
 *
 * @param {string} action A string representing the action for the main thread to take.
 * @param {Object} payload Any additional parameters/data to pass to the main thread.
 *
 * @returns {null}
 */
const sendMsgToMain = (
  action: string,
  payload: any,
): void => {
  parent.postMessage({
    pluginMessage: {
      action,
      payload,
    },
  }, '*');

  return null;
};

/**
 * @description Posts a message to the main thread with `loaded` set to `true`. Used in the
 * main thread to indicate the GUI is listening.
 *
 * @kind function
 * @name sendLoadedMsg
 *
 * @returns {null}
 */
const sendLoadedMsg = (): void => {
  // send message to main thread indicating UI has loaded
  parent.postMessage({ pluginMessage: { loaded: true } }, '*');

  return null;
};

/**
 * @description Manipulates the webview DOM to set the visual button state.
 *
 * @kind function
 * @name setButtonState
 *
 * @param {('ready' | 'working')} action String representing the state to show.
 * @param {Object} button An optional button DOM element.
 *
 * @returns {null}
 */
const setButtonState = (
  action: 'ready' | 'working' = 'ready',
  button?: HTMLButtonElement,
) => {
  // define the button
  let buttonElement: HTMLButtonElement = null;
  if (!button) {
    buttonElement = (<HTMLButtonElement> document.querySelector('button.working'));
  } else {
    buttonElement = button;
  }

  // update the button
  if (buttonElement) {
    if (action === 'working') {
      buttonElement.setAttribute('data-original-text', buttonElement.innerHTML);
      buttonElement.innerHTML = 'Working…';
      buttonElement.classList.add('working');
    } else {
      buttonElement.innerHTML = buttonElement.getAttribute('data-original-text');
      buttonElement.classList.remove('working');
    }
  }

  return null;
};

/* eslint-disable max-len */
// /**
//  * @description Compiles the plugin options form elements in the webview DOM into an object
//  * formatted for consumption in the main thread.
//  *
//  * @kind function
//  * @name readOptions
//  *
//  * @returns {Object} options Includes an array of languages to translate, the action to take
//  * on the text blocks, and whether or not to ignore locked layers.
//  */
// const readOptions = () => {
//   const languagesElement: HTMLSelectElement = (<HTMLSelectElement> document.getElementById('languages'));
//   const textActionElement: HTMLInputElement = document.querySelector('input[name="text-action"]:checked');
//   const translateLockedElement: HTMLInputElement = document.querySelector('input[name="translate-locked"]');

//   const languages: Array<string> = [languagesElement.value]; // array here; eventually multi-lang
//   const textAction: string = textActionElement.value;
//   const translateLocked: boolean = translateLockedElement.checked;

//   const options = {
//     languages,
//     action: textAction,
//     translateLocked,
//   };

//   return options;
// };
/* eslint-enable max-len */

/**
 * @description Watch UI clicks for actions to pass on to the main plugin thread.
 *
 * @kind function
 * @name watchActions
 *
 * @returns {null}
 */
const watchActions = (): void => {
  const actionsElement: HTMLInputElement = (<HTMLInputElement> document.getElementById('actions'));

  if (actionsElement) {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLTextAreaElement;
      const button: HTMLButtonElement = target.closest('button');
      if (button) {
        // find action by element id
        const action = button.id;

        if (
          (action === 'submit' || action === 'remix-all')
          && !button.classList.contains('working')
        ) {
          // GUI - show we are working
          setButtonState('working', button);

          // read the form options
          // const payload = readOptions();
          const payload = null;

          // bubble action to main
          sendMsgToMain(action, payload);
        }
      }
    };

    actionsElement.addEventListener('click', onClick);
  }

  return null;
};

/**
 * @description Watch UI clicks for changes to pass on to the main plugin thread.
 *
 * @kind function
 * @name watchLayer
 *
 * @param {Object} layerElement The html element in the DOM to watch.
 *
 * @returns {null}
 */
const watchLayer = (layerElement: HTMLElement): void => {
  if (layerElement) {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLTextAreaElement;
      const button: HTMLButtonElement = target.closest('button:enabled');
      if ((button && !button.disabled) || (button && button.classList.contains('action-lock-toggle'))) {
        // find action by element class
        const action = button.classList[0].replace('action-', '');

        if (action) {
          const payload: {
            id: string
          } = {
            id: layerElement.id,
          };

          // bubble action to main
          sendMsgToMain(action, payload);
        }
      }
    };

    const onChange = (e: Event) => {
      const newAssignment: string = (<HTMLSelectElement>e.target).value;

      if (newAssignment) {
        const action: string = 'reassign';
        const payload: {
          id: string,
          assignment: string,
        } = {
          id: layerElement.id,
          assignment: newAssignment,
        };

        // bubble action to main
        sendMsgToMain(action, payload);
      }
    };

    const assignmentsElement: HTMLSelectElement = layerElement.querySelector('.assignments');
    if (assignmentsElement) {
      assignmentsElement.addEventListener('change', onChange);
    }
    layerElement.addEventListener('click', onClick);
  }

  return null;
};

/* process Messages from the plugin */

/**
 * @description Clones a template html element and then updates the clone’s contents to match
 * the supplied options for each layer in the supplied array.
 *
 * @kind function
 * @name updateSelectedLayers
 *
 * @param {Array} layers An array of layers to clone. Each entry should include an `id`,
 * an `assignment`, `originalText`, `proposedText`, and a `locked` boolean.
 *
 * @returns {null}
 */
const updateSelectedLayers = (layers: Array<{
  id: string,
  assignment: string,
  originalText: string,
  proposedText: string,
  nodeType: 'text' | 'shape',
  locked: boolean,
}>): void => {
  const layerCount = layers.length;
  const layerListElement: HTMLUListElement = (<HTMLUListElement> document.getElementById('layer-list'));

  if (layerListElement && layers) {
    // remove everything to start
    layerListElement.innerHTML = '';

    if (layerCount > 0) {
      layers.forEach((layer) => {
        const {
          id,
          assignment,
          originalText,
          proposedText,
          nodeType,
          locked,
        } = layer;

        const templateElement: HTMLLIElement = (<HTMLLIElement> document.getElementById(`${nodeType}-layer-holder-original`));
        const newLayerElement: any = templateElement.cloneNode(true);
        newLayerElement.removeAttribute('style');
        newLayerElement.id = id;

        const assignmentsElement: HTMLSelectElement = newLayerElement.querySelector('.assignments');
        assignmentsElement.value = assignment;

        if (!locked) {
          assignmentsElement.disabled = false;
        }

        assignmentsElement.classList.add('styled-select');

        // set reset / remix button states
        if (assignment !== ASSIGNMENTS.unassigned.id && !locked) {
          const resetButtonElement: HTMLButtonElement = newLayerElement.querySelector('.reset-control button');
          if (resetButtonElement && (originalText !== proposedText)) {
            resetButtonElement.disabled = false;
          }

          const remixButtonElement: HTMLButtonElement = newLayerElement.querySelector('.remix-control button');
          if (remixButtonElement) {
            remixButtonElement.disabled = false;
          }
        }

        // set locking toggle state
        const lockingButtonElement: HTMLButtonElement = newLayerElement.querySelector('.locking-control button');
        if (lockingButtonElement && !locked) {
          newLayerElement.classList.remove('locked');
        }

        // set text
        const originalTextElement = newLayerElement.querySelector(`.original-${nodeType} .${nodeType}`);
        originalTextElement.firstChild.nodeValue = originalText;

        const proposedTextElement = newLayerElement.querySelector(`.new-${nodeType} .${nodeType}`);
        proposedTextElement.firstChild.nodeValue = proposedText;

        // add the layer to the list
        layerListElement.appendChild(newLayerElement);

        // set control watchers
        watchLayer(newLayerElement);
      });
    }

    // set/reset blank state
    const bodyElement: HTMLBodyElement = (<HTMLBodyElement> document.getElementsByTagName('BODY')[0]);
    const blankStateElement: HTMLElement = (<HTMLElement> document.getElementById('blank'));
    const actionsElement: HTMLElement = (<HTMLElement> document.getElementById('actions'));
    if (layerCount > 0) {
      bodyElement.classList.remove('blank-state-visible');
      blankStateElement.style.display = 'none';
      actionsElement.removeAttribute('style');

      // set the Figma version of the menu
      selectMenu.init({
        position: 'positionToSelection',
        selector: 'styled-select',
      });
    } else {
      bodyElement.classList.add('blank-state-visible');
      blankStateElement.removeAttribute('style');
      actionsElement.style.display = 'none';
    }
  }

  return null;
};

/**
 * @description Watches for incoming messages from the plugin’s main thread and dispatches
 * them to the appropriate GUI actions.
 *
 * @kind function
 * @name watchIncomingMessages
 *
 * @returns {null}
 */
const watchIncomingMessages = (): void => {
  onmessage = ( // eslint-disable-line no-undef
    event: {
      data: {
        pluginMessage: {
          action: string,
          payload: any,
        }
      }
    },
  ) => {
    const { pluginMessage } = event.data;

    switch (pluginMessage.action) {
      case 'refreshState':
        updateSelectedLayers(pluginMessage.payload);
        break;
      case 'resetState':
        setButtonState('ready');
        break;
      default:
        return null;
    }

    return null;
  };
};

// init GUI
watchActions();
watchIncomingMessages();
sendLoadedMsg();

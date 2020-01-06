/**
 * @description A set of functions to operate the plugin GUI.
 */
import './assets/css/main.scss';
import './vendor/figma-select-menu';

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
    buttonElement = (<HTMLButtonElement> document.getElementById('submit'));
  } else {
    buttonElement = button;
  }

  // update the button
  if (buttonElement) {
    if (action === 'working') {
      buttonElement.innerHTML = 'Working…';
      buttonElement.classList.add('working');
    } else {
      buttonElement.innerHTML = 'Translate';
      buttonElement.classList.remove('working');
    }
  }

  return null;
};

/**
 * @description Compiles the plugin options form elements in the webview DOM into an object
 * formatted for consumption in the main thread.
 *
 * @kind function
 * @name readOptions
 *
 * @returns {Object} options Includes an array of languages to translate, the action to take
 * on the text blocks, and whether or not to ignore locked layers.
 */
const readOptions = () => {
  const languagesElement: HTMLSelectElement = (<HTMLSelectElement> document.getElementById('languages'));
  const textActionElement: HTMLInputElement = document.querySelector('input[name="text-action"]:checked');
  const translateLockedElement: HTMLInputElement = document.querySelector('input[name="translate-locked"]');

  const languages: Array<string> = [languagesElement.value]; // array here; eventually multi-lang
  const textAction: string = textActionElement.value;
  const translateLocked: boolean = translateLockedElement.checked;

  const options = {
    languages,
    action: textAction,
    translateLocked,
  };

  return options;
};

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
          action === 'submit'
          && !button.classList.contains('working')
        ) {
          // GUI - show we are working
          setButtonState('working', button);

          // read the form options
          const payload = readOptions();

          // bubble action to main
          parent.postMessage({
            pluginMessage: {
              action,
              payload,
            },
          }, '*');
        }
      }
    };

    actionsElement.addEventListener('click', onClick);
  }

  return null;
};

/* process Messages from the plugin */

/** WIP
 * @description Sets the plugin’s form elements in the webview DOM to the correct options.
 *
 * @kind function
 * @name updateSelectedLayers
 *
 * @param {Object} options Should include an array of languages to translate, the action to take
 * on the text blocks, and whether or not to ignore locked layers.
 *
 * @returns {null}
 */
const updateSelectedLayers = (layers: Array<{
  id: string,
  assignment: string,
  originalText: string,
  proposedText: string,
}>): void => {
  const layerCount = layers.length;
  const layerListElement: HTMLUListElement = (<HTMLUListElement> document.getElementById('layer-list'));
  const templateElement: HTMLLIElement = (<HTMLLIElement> document.getElementById('layer-holder-original'));

  if (layerListElement && layers) {
    // remove everything to start
    layerListElement.innerHTML = '';

    if (layerCount > 0) {
      layers.forEach((layer) => {
        const newLayerElement: any = templateElement.cloneNode(true);
        newLayerElement.removeAttribute('style');
        newLayerElement.id = layer.id;

        const assignmentsElement = newLayerElement.querySelector('.assignments');
        assignmentsElement.value = layer.assignment;

        const originalTextElement = newLayerElement.querySelector('.original-text .text');
        originalTextElement.firstChild.nodeValue = layer.originalText;

        const proposedTextElement = newLayerElement.querySelector('.new-text .text');
        proposedTextElement.firstChild.nodeValue = layer.proposedText;

        layerListElement.appendChild(newLayerElement);
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
    } else {
      bodyElement.classList.add('blank-state-visible');
      blankStateElement.removeAttribute('style');
      actionsElement.style.display = 'none';
    }
  }
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

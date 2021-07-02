/**
 * A set of functions to operate the plugin GUI.
 */
import './assets/css/main.scss';
import { pollWithPromise } from './Tools';
import App from './views/App.svelte'; // eslint-disable-line import/extensions

const appProps: {
  // items: Array<PluginViewObject>,
  items: any,
} = {
  items: null,
};

const app = new App({
  target: document.body,
  props: appProps,
});

/**
 * Posts a message to the main thread with `loaded` set to `true`. Used in the
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
 * Requests an image (based on URL), loads it to a holder in the DOM
 * and then reads the image into a generated canvas element. The image data is
 * pulled from the canvas element using `getImageData` and the result is passed
 * back to the main thread.
 *
 * @kind function
 * @name makeImageRequest
 *
 * @param {Object} requestUrl The full URL of the image to request.
 *
 * @returns {Promise} Returns a promise for resolution.
 */
const makeImageRequest = async (requestUrl) => {
  if (requestUrl && requestUrl.route) {
    // helper to encode canvas image data into Uint8Array
    const encode = async (canvas, ctx, imageData) => {
      ctx.putImageData(imageData, 0, 0);
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          const reader: any = new FileReader(); // eslint-disable-line no-undef
          reader.onload = () => resolve(new Uint8Array(reader.result));
          reader.onerror = () => reject(new Error('Could not read from blob'));
          reader.readAsArrayBuffer(blob);
        });
      });
    };

    // grab the sandbox image
    const sandboxImgElement: HTMLImageElement = (<HTMLImageElement> document.getElementById('image-sandbox'));

    if (sandboxImgElement) {
      const imageLoaded = (imageElement) => imageElement.complete;

      sandboxImgElement.crossOrigin = 'anonymous';
      sandboxImgElement.src = requestUrl.route;

      // wait to make sure the image is loaded
      await pollWithPromise(() => imageLoaded(sandboxImgElement));

      // create an empty canvas element, same dimensions as the image
      const canvas = document.createElement('canvas');
      canvas.width = sandboxImgElement.width;
      canvas.height = sandboxImgElement.height;

      // copy the image contents to the canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(sandboxImgElement, 0, 0);

      // read the raw data from the canvas
      const canvasImageData = await ctx.getImageData(
        0, 0, sandboxImgElement.width, sandboxImgElement.height,
      );

      // encode the data for figma
      const imageData: Uint8Array = await encode(canvas, ctx, canvasImageData) as Uint8Array;

      // remove the temporary canvas element; reset the image
      canvas.remove();
      sandboxImgElement.removeAttribute('SRC');

      // send the encoded data back to the main thread
      parent.postMessage({ pluginMessage: { imageResponse: imageData } }, '*');
    }
  }
};

/* process Messages from the plugin */

/**
 * Watches for incoming messages from the plugin’s main thread and dispatches
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

    if (pluginMessage?.action) {
      switch (pluginMessage.action) {
        case 'imageRequest':
          makeImageRequest(pluginMessage.payload);
          break;
        case 'refreshState':
          app.items = pluginMessage.payload;
          break;
        default:
          return null;
      }
    }

    return null;
  };

  return null;
};

// init GUI
window.app = app; // eslint-disable-line no-undef
watchIncomingMessages();
sendLoadedMsg();

export default app;

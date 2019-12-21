import {
  FRAME_TYPES,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
} from './constants';

// --- helper functions
/**
 * @description An approximation of `forEach` but run in an async manner.
 *
 * @kind function
 * @name asyncForEach
 *
 * @param {Array} array An array to iterate.
 * @param {Function} callback A function to feed the single/iterated item back to.
 *
 * @returns {null} Runs the callback function.
 */
const asyncForEach = async (
  array: Array<any>,
  callback: Function,
): Promise<Function> => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array); // eslint-disable-line no-await-in-loop
  }
  return null;
};

/**
 * @description An approximation of `forEach` but run in an async manner.
 *
 * @kind function
 * @name pollWithPromise
 *
 * @param {Function} externalCheck The external function to run a check against.
 * The function should resolve to `true`.
 * @param {Class} messenger An active instance of the Messenger class for logging (optional).
 *
 * @returns {Promise} Returns a promise for resolution.
 */
const pollWithPromise = (
  externalCheck: Function,
  messenger?: { log: Function },
  name?: string,
): Promise<Function> => {
  const isReady: Function = externalCheck;
  const checkName = name || externalCheck.name;

  const checkIsReady = (resolve) => {
    if (messenger) { messenger.log(`Checking: ${checkName} 🤔`); }

    if (isReady()) {
      if (messenger) { messenger.log(`Resolve ${checkName} 🙏`); }

      resolve(true);
    } else {
      setTimeout(checkIsReady, 25, resolve);
    }
  };
  return new Promise(checkIsReady);
};

/** WIP
 * @description An approximation of `forEach` but run in an async manner.
 *
 * @kind function
 * @name asyncNetworkRequest
 *
 * @param {Function} externalCheck The external function to run a check against.
 * The function should resolve to `true`.
 * @param {Class} messenger An active instance of the Messenger class for logging (optional).
 *
 * @returns {Promise} Returns a promise for resolution.
 */
const asyncNetworkRequest = async (options: {
  requestUrl: string,
  headers?: any,
  bodyToSend?: any,
  messenger?: { log: Function },
}) => {
  const {
    requestUrl,
    headers,
    bodyToSend,
    messenger,
  } = options;

  // set blank response
  let response = null;

  const awaitResponse = async () => {
    // simple function to check for existence of a response
    const responseExists = () => (response !== null);

    // set a one-time use listener
    figma.ui.once('message', (msg) => {
      if (msg && msg.apiResponse) { response = msg.apiResponse; }
    });

    await pollWithPromise(responseExists, messenger);
  };

  const makeRequest = () => {
    figma.ui.postMessage({
      action: 'networkRequest',
      payload: {
        route: requestUrl,
        headers,
        bodyToSend,
      },
    });
  };

  // do the things
  makeRequest();
  await awaitResponse();
  return response;
};

// we need to wait for the UI to be ready:
// network calls are made through the UI iframe
const awaitUIReadiness = async (messenger?) => {
  // set UI readiness check to falsey
  let ready = false;

  // simple function to check truthiness of `ready`
  const isUIReady = () => ready;

  // set a one-time use listener
  figma.ui.once('message', (msg) => {
    if (msg && msg.loaded) { ready = true; }
  });

  await pollWithPromise(isUIReady, messenger);
};

/** WIP
 * @description A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 * an action (`add` or `remove`).
 *
 * @kind function
 * @name makeNetworkRequest
 *
 * @param {string} key String representing the top-level area of the array to modify.
 * @param {Object} item Object containing the new bit of data to add or
 * remove (must include an `id` string for comparison).
 * @param {Array} array The array to be modified.
 * @param {string} action Constant string representing the action to take (`add` or `remove`).
 *
 * @returns {Object} The modified array.

 * @private
 */
const makeNetworkRequest = (options: {
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  headers?: any,
  bodyToSend?: any,
}) => {
  const { route, headers, bodyToSend } = options;
  const body = bodyToSend ? JSON.stringify(bodyToSend) : null;
  const method = options.method || 'POST';

  fetch(route, { // eslint-disable-line no-undef
    method,
    headers,
    body,
  })
    .then((response) => {
      response.json()
        .then((json) => {
          if (json) {
            // return json blob back to main thread
            parent.postMessage({ pluginMessage: { apiResponse: json } }, '*');
          }
        });
    })
    .catch(err => console.error(err)); // eslint-disable-line no-console
};

/** WIP - updated
 * @description A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 * an action (`add` or `remove`).
 *
 * @kind function
 * @name updateArray
 *
 * @param {string} key String representing the top-level area of the array to modify.
 * @param {Object} item Object containing the new bit of data to add or
 * remove (must include an `id` string for comparison).
 * @param {Array} array The array to be modified.
 * @param {string} action Constant string representing the action to take (`add` or `remove`).
 *
 * @returns {Object} The modified array.

 * @private
 */
const updateArray = (
  array,
  item,
  itemKey: string = 'id',
  action: 'add' | 'update' | 'remove' = 'add',
) => {
  let updatedArray = array;

  // find the index of a pre-existing `id` match on the array
  const itemIndex: number = updatedArray.findIndex(
    foundItem => (foundItem[itemKey] === item[itemKey]),
  );

  // if a match exists, remove it
  // even if the action is `add`, always remove the existing entry to prevent duplicates
  if (itemIndex > -1) {
    updatedArray = [
      ...updatedArray.slice(0, itemIndex),
      ...updatedArray.slice(itemIndex + 1),
    ];
  }

  // if the `action` is `add` (or update), append the new `item` to the array
  if (action !== 'remove') {
    updatedArray.push(item);
  }

  return updatedArray;
};

/**
 * @description Takes a layer object and traverses parent relationships until the top-level
 * `FRAME_TYPES.main` layer is found. Returns the frame layer.
 *
 * @kind function
 * @name findTopFrame
 * @param {Object} layer A Figma layer object.
 *
 * @returns {Object} The top-level `FRAME_TYPES.main` layer.
 */
const findTopFrame = (layer: any) => {
  let { parent } = layer;

  // if the parent is a page, we're done
  if (parent && parent.type === 'PAGE') {
    return parent;
  }

  // loop through each parent until we find the outermost FRAME
  if (parent) {
    while (parent && parent.type !== FRAME_TYPES.main) {
      parent = parent.parent;
    }
  }
  return parent;
};

/** WIP
 * @description An approximation of `forEach` but run in an async manner.
 *
 * @kind function
 * @name loadTypefaces
 *
 * @param {Array} array An array to iterate.
 * @param {Function} callback A function to feed the single/iterated item back to.
 *
 * @returns {null} Runs the callback function.
 */
const loadTypefaces = async (
  typefaces: Array<FontName>,
  messenger?: { log: Function },
) => {
  messenger.log('begin loading typefaces');
  await asyncForEach(typefaces, async (typeface: FontName) => {
    await figma.loadFontAsync(typeface);
    messenger.log(`loading ${typeface.family} ${typeface.style} typeface`);
  });

  messenger.log('done loading typefaces');
};

/**
 * @description Resizes the plugin iframe GUI within the Figma app.
 *
 * @kind function
 * @name resizeGUI
 * @param {string} type A string representing the `type` of GUI to load.
 * @param {Function} ui An instance of `figma.ui` with the GUI pre-loaded.
 *
 * @returns {null}
 */
const resizeGUI = (
  type: string,
  ui: { resize: Function },
): void => {
  ui.resize(
    GUI_SETTINGS[type].width,
    GUI_SETTINGS[type].height,
  );

  return null;
};

/** WIP
 * @description Checks the `FEATURESET` environment variable from webpack and
 * determines if the featureset build should be `internal` or not.
 *
 * @kind function
 * @name isTextNode
 *
 * @returns {boolean} `true` if the build is internal, `false` if it is not.
 */
const isTextNode = (node: any): node is TextNode => node.type === 'TEXT';

/** WIP
 * @description Checks the `FEATURESET` environment variable from webpack and
 * determines if the featureset build should be `internal` or not.
 *
 * @kind function
 * @name dataNamespace
 *
 * @returns {string} `true` if the build is internal, `false` if it is not.
 */
const dataNamespace = (): string => {
  const identifier: string = PLUGIN_IDENTIFIER;
  const key: string = process.env.SECRET_KEY ? process.env.SECRET_KEY : '1234';
  let namespace: string = `${identifier.toLowerCase()}${key.toLowerCase()}`;
  namespace = namespace.replace(/[^0-9a-z]/gi, '');
  return namespace;
};

/**
 * @description Checks the `FEATURESET` environment variable from webpack and
 * determines if the featureset build should be `internal` or not.
 *
 * @kind function
 * @name isInternal
 *
 * @returns {boolean} `true` if the build is internal, `false` if it is not.
 */
const isInternal = (): boolean => {
  const buildIsInternal: boolean = process.env.FEATURESET === 'internal';
  return buildIsInternal;
};

export {
  asyncForEach,
  asyncNetworkRequest,
  awaitUIReadiness,
  dataNamespace,
  findTopFrame,
  isInternal,
  isTextNode,
  loadTypefaces,
  makeNetworkRequest,
  pollWithPromise,
  resizeGUI,
  updateArray,
};

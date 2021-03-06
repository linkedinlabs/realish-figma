import {
  ASSIGNMENTS,
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
} from './constants';

// --- helper functions
/**
 * An approximation of `forEach` but run in an async manner.
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
 * An approximation of `setTimeout` but run in an async manner
 * with logging to Messenger.
 *
 * @kind function
 * @name pollWithPromise
 *
 * @param {Function} externalCheck The external function to run a check against.
 * The function should resolve to `true`.
 * @param {Object} messenger An initialized instance of the Messenger class for logging (optional).
 * @param {Function} messenger.log The log function from the Messenger class.
 * @param {string} name The name of the check for logging purposes (optional).
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

/**
 * Manages the process of passing a network request along to the plugin
 * UI and waiting for the response.
 *
 * @kind function
 * @name asyncNetworkRequest
 *
 * @param {Object} options An object including the request options: The URL the request should
 * go to (`requestUrl`), headers to pass along to the request (optional), an optional request
 * body (`bodyToSend`), and an initialized instance of the Messenger class for logging (optional).
 * @param {string} options.requestUrl The URL the request should go to.
 * @param {any} options.headers Headers to pass along to the request (optional).
 * @param {any} options.bodyToSend An optional request body.
 * @param {Object} options.messenger An optional initialized instance of the Messenger class.
 * @param {Object} options.messenger.log The log function from the Messenger class.
 *
 * @returns {Object} Returns the result of the network request (response).
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

  // polling function to check for a response from the plugin UI
  const awaitResponse = async () => {
    // simple function to check for existence of a response
    const responseExists = () => (response !== null);

    // set a one-time use listener
    figma.ui.once('message', (msg) => {
      if (msg && msg.apiResponse) { response = msg.apiResponse; }
    });

    await pollWithPromise(responseExists, messenger);
  };

  // makes the request by passing the options along to the plugin UI
  const makeRequest = () => {
    figma.ui.postMessage({
      action: 'networkRequest',
      payload: {
        route: requestUrl,
        headers,
        bodyToSend,
      },
    });

    if (messenger) {
      messenger.log(`Network request: ${requestUrl}`);
    }
  };

  // do the things
  makeRequest();
  await awaitResponse();
  return response;
};

/**
 * Similar to `asyncNetworkRequest`, manages the process for requesting the
 * download of a remote image.
 *
 * @kind function
 * @name asyncImageRequest
 *
 * @param {Object} options An object including the request options: The URL the request should
 * go to (`requestUrl`) and an initialized instance of the Messenger class for logging (optional).
 * @param {string} options.requestUrl The URL the request should go to.
 * @param {Object} options.messenger An optional initialized instance of the Messenger class.
 * @param {Object} options.messenger.log The log function from the Messenger class.
 *
 * @returns {Object} Returns the result of the network request (response).
 */
const asyncImageRequest = async (options: {
  requestUrl: string,
  messenger?: { log: Function },
}) => {
  const {
    messenger,
    requestUrl,
  } = options;

  // set blank response
  let response = null;

  // polling function to check for a response from the plugin UI
  const awaitResponse = async () => {
    // simple function to check for existence of a response
    const responseExists = () => (response !== null);

    // set a one-time use listener
    figma.ui.once('message', (msg) => {
      if (msg && msg.imageResponse) { response = msg.imageResponse; }
    });

    await pollWithPromise(responseExists, messenger);
  };

  // makes the request by passing the options along to the plugin UI
  const makeRequest = () => {
    figma.ui.postMessage({
      action: 'imageRequest',
      payload: {
        route: requestUrl,
      },
    });

    if (messenger) {
      messenger.log(`Request image at: ${requestUrl}`);
    }
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

/**
 * A helper function that uses `fetch` to make a network request.
 * This helper can only be used from the UI thread. The main thread of the plugin
 * cannot make network requests. From the main thread, use `asyncNetworkRequest`. The result
 * is a message posted to the main thread of the plugin with the results of the `fetch` call.
 *
 * @kind function
 * @name makeNetworkRequest
 *
 * @param {Object} options The network request options, containing the URL/route for the
 * request (`route`), the `method` of the request (default is `POST`), optional
 * request `headers`, and an optional request body (`bodyToSend`).
 * @param {string} options.route The URL (or local route) the request should go to.
 * @param {string} options.method The request method (i.e. GET, POST, etc.).
 * @param {any} options.headers Headers to pass along to the request (optional).
 * @param {any} options.bodyToSend An optional request body.
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
    .catch((err) => console.error(err)); // eslint-disable-line no-console
};

/**
 * A reusable helper function to take an array and add or remove data from it
 * based on a top-level key and a defined action.
 *
 * @kind function
 * @name updateArray
 *
 * @param {Array} array The array to be modified.
 * @param {Object} item Object containing the new bit of data to add, remove, or update.
 * @param {string} itemKey String representing the key to match (default is `id`).
 * @param {string} action Constant string representing the action to take
 * (`add`, `update`, or `remove`).
 *
 * @returns {Object} The modified array.
 */
const updateArray = (
  array: Array<any>,
  item,
  itemKey: string = 'id',
  action: 'add' | 'update' | 'remove' = 'add',
) => {
  let updatedArray = array;

  // find the index of a pre-existing `id` match on the array
  const itemIndex: number = updatedArray.findIndex(
    (foundItem) => (foundItem[itemKey] === item[itemKey]),
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
 * Reverse iterates the node tree to determine the next-level component instance
 * (if one exists) for the node. This allows you to easily find a Main Component when dealing
 * with an instance that may be nested within several component instances.
 *
 * @kind function
 * @name findNextInstance
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the top component instance (`InstanceNode`) or `null`.
 */
const findNextInstance = (node: any): InstanceNode => {
  let { parent } = node;
  let currentNode = node;
  let currentNextInstance: InstanceNode = null;

  if (parent) {
    if (parent.type === CONTAINER_NODE_TYPES.instance) {
      currentNextInstance = parent;
    }

    if (!currentNextInstance) {
      while (parent && parent.type !== 'PAGE') {
        currentNode = parent;
        if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
          // update the top-most main component with the current one
          currentNextInstance = currentNode;
        }
        parent = parent.parent;
      }
    }
  }

  if (currentNextInstance) {
    return currentNextInstance;
  }
  return null;
};

/**
 * Takes a node object and traverses parent relationships until the top-level
 * `CONTAINER_NODE_TYPES.frame` node is found. Returns the frame node.
 *
 * @kind function
 * @name findTopFrame
 * @param {Object} node A Figma node object.
 *
 * @returns {Object} The top-level `CONTAINER_NODE_TYPES.frame` node.
 */
const findTopFrame = (node: any) => {
  let { parent } = node;

  // if the parent is a page, we're done
  if (parent && parent.type === 'PAGE') {
    return parent;
  }

  // loop through each parent until we find the outermost FRAME
  if (parent) {
    while (parent && parent.parent.type !== 'PAGE') {
      parent = parent.parent;
    }
  }
  return parent;
};

/**
 * Reverse iterates the node tree to determine the top-level component instance
 * (if one exists) for the node. This allows you to easily find a Master Component when dealing
 * with an instance that may be nested within several component instances.
 *
 * @kind function
 * @name findTopInstance
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the top component instance (`InstanceNode`) or `null`.
 */
const findTopInstance = (node: any): InstanceNode => {
  let { parent } = node;
  let currentNode = node;
  let currentTopInstance: InstanceNode = null;

  if (parent) {
    // iterate until the parent is a page
    while (parent && parent.type !== 'PAGE') {
      currentNode = parent;
      if (currentNode.type === CONTAINER_NODE_TYPES.instance) {
        // update the top-most main component with the current one
        currentTopInstance = currentNode;
      }
      parent = parent.parent;
    }
  }

  if (currentTopInstance) {
    return currentTopInstance;
  }
  return null;
};

/**
 * Reverse iterates the node tree to determine the top-level component
 * (if one exists) for the node. This allows you to check if a node is part of a component.
 *
 * @kind function
 * @name findTopComponent
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 *
 * @returns {Object} Returns the component (`ComponentNode`) or `null`.
 */
const findTopComponent = (node: any) => {
  // return self if component
  if (node.type === CONTAINER_NODE_TYPES.component) {
    return node;
  }

  let { parent } = node;
  let currentNode = node;
  let componentNode: ComponentNode = null;
  if (parent) {
    // iterate until the parent is a page or component is found;
    // components cannot nest inside other components, so we can stop at the first
    // found component
    while (parent && parent.type !== 'PAGE' && componentNode === null) {
      currentNode = parent;
      if (currentNode.type === CONTAINER_NODE_TYPES.component) {
        // update the top-most main component with the current one
        componentNode = currentNode;
      }
      parent = parent.parent;
    }
  }

  if (componentNode) {
    return componentNode;
  }
  return null;
};

/**
 * Maps the nesting order of a node within the tree and then uses that “map”
 * as a guide to find the peer node within the an instance’s Master Component.
 *
 * @kind function
 * @name matchMasterPeerNode
 *
 * @param {Object} node A Figma node object (`SceneNode`).
 * @param {Object} topNode A Figma instance node object (`InstanceNode`).
 *
 * @returns {Object} Returns the main component or `null`.
 */
const matchMasterPeerNode = (node: any, topNode: InstanceNode) => {
  // finds the `index` of self in the parent’s children list
  const indexAtParent = (childNode: any): number => childNode.parent.children.findIndex(
    (child) => child.id === childNode.id,
  );

  // set some defaults
  let { parent } = node;
  const childIndices = [];
  const mainComponentNode: ComponentNode = topNode.mainComponent;
  let mainPeerNode = null;
  let currentNode = node;

  // iterate up the chain, collecting indices in each child list
  if (parent) {
    childIndices.push(indexAtParent(node));
    while (parent && parent.id !== topNode.id) {
      currentNode = parent;
      parent = parent.parent;
      childIndices.push(indexAtParent(currentNode));
    }
  }

  // navigate down the chain of the corresponding main component using the
  // collected child indices to locate the peer node
  if (childIndices.length > 0 && mainComponentNode) {
    const childIndicesReversed = childIndices.reverse();
    let { children } = mainComponentNode;
    let selectedChild = null;

    childIndicesReversed.forEach((childIndex, index) => {
      selectedChild = children[childIndex];
      if ((childIndicesReversed.length - 1) > index) {
        if (selectedChild?.children) {
          children = selectedChild.children;
        }
      }
    });

    // the last selected child should be the peer node
    if (selectedChild) {
      mainPeerNode = selectedChild;
    }
  }

  return mainPeerNode;
};

/**
 * A shared helper functional to easily retrieve the data namespace used
 * for shared plugin data. Changing this function will potentially make it impossible
 * for existing users to retrieve data saved to nodes before the change.
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
 * A shared helper function to retrieve type assignment data in raw form (JSON).
 *
 * @kind function
 * @name getNodeAssignmentData
 *
 * @param {Object} node The text node to retrieve the assignment on.
 *
 * @returns {string} The assignment is returned as an unparsed JSON string.
 */
const getNodeAssignmentData = (node: SceneNode): string => {
  // check first for a direct assignment
  let assignmentData = node.getSharedPluginData(dataNamespace(), DATA_KEYS.assignment);

  if (!assignmentData) {
    const getPeerNodeAssignmentData = (instanceNodeToQuery: InstanceNode) => {
      let peerAssignmentData: string = null;
      const peerNode = matchMasterPeerNode(node, instanceNodeToQuery);
      if (peerNode) {
        peerAssignmentData = getNodeAssignmentData(peerNode);
      }

      return peerAssignmentData;
    };

    // iterate up the chain and check of assignment on any upper-level (parent)
    // component nodes. higher-level nodes with assignment data should override
    // lower-level nodes. but higher-level nodes without assignment should not.
    let nextInstanceNode: InstanceNode = findNextInstance(node);

    if (nextInstanceNode) {
      while (nextInstanceNode) {
        const currentNode = nextInstanceNode;

        // check component peer for assignment data
        const newAssignmentData = getPeerNodeAssignmentData(currentNode);
        if (newAssignmentData) {
          // update the assignment data with the current level of assignment
          assignmentData = newAssignmentData;
        }

        // find the next instance (if it exists)
        nextInstanceNode = findNextInstance(currentNode);
      }
    }
  }

  return assignmentData;
};

/**
 * An async function to load multiple typefaces using Figma’s `loadFontAsync`.
 *
 * @kind function
 * @name loadTypefaces
 *
 * @param {Array} typefaces An array of typefaces to load. Typefaces in the array must be
 * formatted to match Figma’s `FontName` type.
 * @param {Object} messenger An initialized instance of the Messenger class for logging (optional).
 * @param {Function} messenger.log The log function from the Messenger class.
 *
 * @returns {Promise} Returns a promise for resolution.
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
 * Sends a message and applicable payload to the main thread from the UI thread.
 *
 * @kind function
 * @name sendMsgToMain
 *
 * @param {string} action A string representing the action for the main thread to take.
 * @param {Object} payload Any additional parameters/data to pass to the main thread.
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
};

/**
 * Resizes the plugin iframe GUI within the Figma app.
 *
 * @kind function
 * @name resizeGUI
 * @param {string} type A string representing the `type` of GUI to load.
 * @param {Object} ui An instance of `figma.ui` with the GUI pre-loaded.
 * @param {Function} ui.resize An instance of `figma.ui.resize` function.
 */
const resizeGUI = (
  type: string,
  ui: { resize: Function },
): void => {
  ui.resize(
    GUI_SETTINGS[type].width,
    GUI_SETTINGS[type].height,
  );
};

/**
 * Checks a node’s `type` to see if it is a `TextNode`.
 *
 * @kind function
 * @name isTextNode
 *
 * @param {Object} node The node to check.
 *
 * @returns {boolean} `true` if the node is a `TextNode`.
 */
const isTextNode = (node: any): node is TextNode => node.type === 'TEXT';

/**
 * Checks if a supplied `assignment` string and `nodeType` is valid (it can be
 * matched with an entry in `ASSIGNMENTS`).
 *
 * @kind function
 * @name isValidAssignment
 *
 * @param {string} assignment The assignment to check (`id` in `ASSIGNMENTS`).
 * @param {string} nodeType The type to check (`nodeType` in `ASSIGNMENTS`).
 *
 * @returns {boolean} `true` if the assignment is valid.
 */
const isValidAssignment = (assignment: string, nodeType: 'shape' | 'text'): boolean => {
  let isValid = false;

  if (assignment === ASSIGNMENTS.unassigned.id) {
    isValid = true;
    return isValid;
  }

  Object.keys(ASSIGNMENTS).forEach((key) => {
    if (ASSIGNMENTS[key].id === assignment && ASSIGNMENTS[key].nodeType === nodeType) {
      isValid = true;
    }
  });
  return isValid;
};

/**
 * Checks the `FEATURESET` environment variable from webpack and
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
  asyncImageRequest,
  asyncNetworkRequest,
  awaitUIReadiness,
  dataNamespace,
  findTopComponent,
  findTopFrame,
  findTopInstance,
  getNodeAssignmentData,
  isInternal,
  isTextNode,
  isValidAssignment,
  loadTypefaces,
  makeNetworkRequest,
  matchMasterPeerNode,
  pollWithPromise,
  resizeGUI,
  sendMsgToMain,
  updateArray,
};

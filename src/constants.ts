/* eslint-disable import/prefer-default-export */

/**
 * @description A unique string to identify the plugin within Figma.
 * Changing one of these keys will break data retrieval or reset data in any
 * `xPluginData` getters/setters and potentially elsewhere.
 * [More info]{@link https://www.figma.com/plugin-docs/api/properties/nodes-setsharedplugindata/}
 *
 * @kind constant
 * @name PLUGIN_IDENTIFIER
 * @type {string}
 */
const PLUGIN_IDENTIFIER = 'com.linkedin.figma.realish-plugin';

/**
 * @description The public-facing name for the plugin. This should match the
 * `name` stated in manifset.json.
 *
 * @kind constant
 * @name PLUGIN_NAME
 * @type {string}
 */
const PLUGIN_NAME = 'Realish';

/**
 * @description An object containing the current string constants used as keys in plugin data.
 * Changing one of these keys will break data retrieval or reset data in any
 * `xPluginData` getters/setters and potentially elsewhere.
 *
 * @kind constant
 * @name DATA_KEYS
 * @type {Object}
 */
const DATA_KEYS = {
  options: `${PLUGIN_IDENTIFIER}.options-001`,
  assignment: `${PLUGIN_IDENTIFIER}.assignment-001`,
  textOriginal: `${PLUGIN_IDENTIFIER}.text-original-001`,
  textProposed: `${PLUGIN_IDENTIFIER}.text-proposed-001`,
  locked: `${PLUGIN_IDENTIFIER}.locked-001`,
};

/** WIP
 * @description An object containing the current string constants used as keys in plugin data.
 * Changing one of these keys will break data retrieval or reset data in any
 * `xPluginData` getters/setters and potentially elsewhere.
 *
 * @kind constant
 * @name ASSIGNMENTS
 * @type {Object}
 */
const ASSIGNMENTS = {
  unassigned: 'unassigned',
  animal: 'animal',
  color: 'color',
  company: 'company',
  degreeBadge: 'degree-badge',
  jobTitle: 'job-title',
  name: 'name',
  timestamp: 'timestamp',
};

/**
 * @description An object containing the current string constants the Figma API returns for
 * top-level (`main`) layer and `group` layer types.
 *
 * @kind constant
 * @name FRAME_TYPES
 * @type {Object}
 */
const FRAME_TYPES = {
  group: 'GROUP',
  main: 'FRAME',
};

/**
 * @description An object containing `height`/`width` settings for the plugin GUI window.
 *
 * @kind constant
 * @name GUI_SETTINGS
 * @type {Object}
 */
const GUI_SETTINGS = {
  default: {
    width: 360,
    height: 180,
  },
  quick: {
    width: 200,
    height: 326,
  },
  info: {
    width: 200,
    height: 324,
  },
};

/**
 * @description An object containing the sets of typefaces in-use by the plugin.
 *
 * @kind constant
 * @name TYPEFACES
 * @type {Object}
 */
const TYPEFACES = {
  primary: {
    family: 'Helvetica Neue',
    style: 'Regular',
  },
  secondary: {
    family: 'Roboto',
    style: 'Regular',
  },
};

export {
  ASSIGNMENTS,
  DATA_KEYS,
  FRAME_TYPES,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
  TYPEFACES,
};
/* eslint-enable import/prefer-default-export */

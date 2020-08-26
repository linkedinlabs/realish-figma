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

/**
 * @description An object containing the available data type assignments. The `id` is
 * used for matching. The `text` is only used as a label.
 *
 * @kind constant
 * @name ASSIGNMENTS
 * @type {Object}
 */
const ASSIGNMENTS = {
  unassigned: { id: 'unassigned', text: 'Unassigned', nodeType: null },
  alumniCompany: { id: 'alumni-company', text: 'Alumni (Company)', nodeType: 'text' },
  alumniSchool: { id: 'alumni-school', text: 'Alumni (School)', nodeType: 'text' },
  articleTitle: { id: 'article-title', text: 'Article Title', nodeType: 'text' },
  avatarCompany: { id: 'avatar-company', text: 'Company', nodeType: 'shape' },
  avatarEvent: { id: 'avatar-event', text: 'Event', nodeType: 'shape' },
  avatarGroup: { id: 'avatar-group', text: 'Group', nodeType: 'shape' },
  avatarMediaSource: { id: 'avatar-media-source', text: 'Media Source', nodeType: 'shape' },
  avatarPublication: { id: 'avatar-publication', text: 'Publication', nodeType: 'shape' },
  avatarPerson: { id: 'avatar-person', text: 'Person', nodeType: 'shape' },
  avatarSchool: { id: 'avatar-school', text: 'School', nodeType: 'shape' },
  company: { id: 'company', text: 'Company', nodeType: 'text' },
  connections: { id: 'connections', text: 'Connections', nodeType: 'text' },
  country: { id: 'country', text: 'Country', nodeType: 'text' },
  date: { id: 'date', text: 'Date', nodeType: 'text' },
  dateShort: { id: 'date-short', text: 'Date (Short)', nodeType: 'text' },
  degreeBadge: { id: 'degree-badge', text: 'Degree Badge', nodeType: 'text' },
  domain: { id: 'domain', text: 'Domain Name', nodeType: 'text' },
  email: { id: 'email', text: 'Email', nodeType: 'text' },
  event: { id: 'event', text: 'Event', nodeType: 'text' },
  group: { id: 'group', text: 'Group', nodeType: 'text' },
  industry: { id: 'industry', text: 'Industry', nodeType: 'text' },
  jobTitle: { id: 'job-title', text: 'Job Title', nodeType: 'text' },
  location: { id: 'location', text: 'Location', nodeType: 'text' },
  mediaSource: { id: 'media-source', text: 'Media Source', nodeType: 'text' },
  name: { id: 'name', text: 'Name', nodeType: 'text' },
  publication: { id: 'publication', text: 'Publication', nodeType: 'text' },
  school: { id: 'school', text: 'School', nodeType: 'text' },
  timestamp: { id: 'timestamp', text: 'Timestamp', nodeType: 'text' },
};

/**
 * @description An object containing the current string constants the Figma API returns for
 * top-level (`main`) layer and `group` layer types.
 *
 * @kind constant
 * @name CONTAINER_NODE_TYPES
 * @type {Object}
 */
const CONTAINER_NODE_TYPES = {
  component: 'COMPONENT',
  frame: 'FRAME',
  group: 'GROUP',
  instance: 'INSTANCE',
};

/**
 * @description An object containing snippets of copy (text) to re-use across the plugin’s UI.
 *
 * @kind constant
 * @name GUI_CONTENT
 * @type {Object}
 */
const GUI_CONTENT = {
  relaunch: {
    layer: 'Generate random content for this layer.',
    component: 'Generate random content for layers inside this component.',
  },
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

export {
  ASSIGNMENTS,
  CONTAINER_NODE_TYPES,
  DATA_KEYS,
  GUI_CONTENT,
  GUI_SETTINGS,
  PLUGIN_IDENTIFIER,
  PLUGIN_NAME,
};
/* eslint-enable import/prefer-default-export */

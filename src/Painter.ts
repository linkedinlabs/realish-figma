import { dataNamespace, isTextNode } from './Tools';
import { DATA_KEYS } from './constants';

// --- main Painter class function
/**
 * @description A class to add elements directly onto Figma file frames.
 *
 * @class
 * @name Painter
 *
 * @constructor
 *
 * @property layer The SceneNode in the Figma file that we want to annotate or modify.
 * @property frame The top-level FrameNode in the Figma file that we want to annotate or modify.
 * @property page The PageNode in the Figma file containing the corresponding `frame` and `layer`.
 */
export default class Painter {
  layer: TextNode;
  sessionKey: number;
  constructor({ layer, sessionKey }) {
    this.layer = isTextNode(layer) ? layer : null;
    this.sessionKey = sessionKey;
  }

  /** WIP
   * @description Locates annotation text in a layer’s Settings object and
   * builds the visual annotation on the Figma frame.
   *
   * @kind function
   * @name replaceText
   *
   * @returns {Object} A result object container success/error status and log/toast messages.
   */
  replaceText() {
    const result: {
      status: 'error' | 'success',
      messages: {
        toast: string,
        log: string,
      },
    } = {
      status: null,
      messages: {
        toast: null,
        log: null,
      },
    };

    // load based layer data
    const assignmentData = this.layer.getSharedPluginData(dataNamespace(), DATA_KEYS.assignment);
    const assignment: string = JSON.parse(assignmentData || null);
    const lockedData = this.layer.getSharedPluginData(dataNamespace(), DATA_KEYS.locked);
    const locked: boolean = lockedData ? JSON.parse(lockedData) : false;
    const textProposedKey: string = `${DATA_KEYS.textProposed}-${this.sessionKey}`;
    const proposedTextData = this.layer.getSharedPluginData(dataNamespace(), textProposedKey);
    const proposedText = JSON.parse(proposedTextData || null);

    // if the layer is marked as locked, shouldn’t do anything to it
    if (locked) {
      result.status = 'error';
      result.messages.log = `Layer ${this.layer.id} is locked`;
      return result;
    }

    // if the layer is marked as locked, shouldn’t do anything to it
    if (!assignment || assignment === 'unassigned') {
      result.status = 'error';
      result.messages.log = `Layer ${this.layer.id} is unassigned`;
      return result;
    }


    // if there are no translations, return with error
    if (!proposedText) {
      result.status = 'error';
      result.messages.log = `Layer ${this.layer.id} is missing proposed text`;
      return result;
    }

    // if the current text matches the proposed text, nothing to do
    if (proposedText === this.layer.characters) {
      result.status = 'success';
      result.messages.log = 'Current text matches proposed; nothing to replace';
      return result;
    }

    // update the layer’s text with the translation
    const textNode: TextNode = this.layer;

    // update (replace) the text
    const updatedCharacters: string = proposedText;
    textNode.characters = updatedCharacters;

    // return a successful result
    result.status = 'success';
    result.messages.log = `Layer ${this.layer.id} text updated`;
    return result;
  }
}

import { dataNamespace } from './Tools';
import { ASSIGNMENTS, DATA_KEYS } from './constants';

const Generator = require('unique-names-generator'); // temp

const generateRandomName = () => {
  const { uniqueNamesGenerator, names } = Generator; // temp
  const capitalizedName: string = uniqueNamesGenerator({
    dictionaries: [names, names],
    separator: ' ',
    length: 2,
    style: 'capital',
  });

  return capitalizedName;
};

const generateRandomAnimal = () => {
  const { uniqueNamesGenerator, animals } = Generator; // temp
  const capitalizedName: string = uniqueNamesGenerator({
    dictionaries: [animals],
    length: 1,
    style: 'capital',
  });

  return capitalizedName;
};

const generateRandomColor = () => {
  const { uniqueNamesGenerator, colors } = Generator; // temp
  const capitalizedName: string = uniqueNamesGenerator({
    dictionaries: [colors],
    length: 1,
    style: 'capital',
  });

  return capitalizedName;
};

/** WIP
 * @description A class to handle UI alerts, messages, and logging.
 *
 * @class
 * @name Data
 *
 * @constructor
 *
 * @property event The encompassing event we are logging or applying a message/alert to.
 * @property page The Figma file that will display messages/alerts
 * or that the log will reference.
 */
export default class Data {
  textNode: TextNode;

  constructor({
    for: textNode,
  }) {
    this.textNode = textNode;
  }

  /** WIP
   * @description Takes a string message and logs it at one of 2 levels (normal or error).
   *
   * @kind function
   * @name generateRandomText
   * @param {string} message The string containing the message to be logged.
   * @param {string} type The optional string declaring the type of log: error or normal (default).
   */
  generateRandomText() {
    const assignmentData = this.textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.assignment);
    const assignment: string = JSON.parse(assignmentData || null);
    let randomText: string = null;

    if (assignment) {
      switch (assignment) {
        case ASSIGNMENTS.name:
          randomText = generateRandomName();
          break;
        case ASSIGNMENTS.animal:
          randomText = generateRandomAnimal();
          break;
        case ASSIGNMENTS.color:
          randomText = generateRandomColor();
          break;
        default:
          return null;
      }
    }

    return randomText;
  }
}

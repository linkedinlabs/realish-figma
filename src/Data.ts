import companies from './data/companies';
import countries from './data/countries';
import degreeBadges from './data/degree-badges';
import jobTitles from './data/job-titles';
import timestamps from './data/timestamps';
import { dataNamespace } from './Tools';
import { ASSIGNMENTS, DATA_KEYS } from './constants';

const Generator = require('unique-names-generator');

/** WIP
 * @description Takes a string message and logs it at one of 2 levels (normal or error).
 *
 * @kind function
 * @name generateRandom
 * @param {string} message The string containing the message to be logged.
 * @param {string} type The optional string declaring the type of log: error or normal (default).
 */
const generateRandom = (assignment): string => {
  const { uniqueNamesGenerator } = Generator;
  const dictionaries = [];
  const style: 'lowerCase' | 'upperCase' | 'capital' = 'capital';
  let separator: string = null;
  let length: number = 1;
  let newRandomString = null;

  switch (assignment) {
    case ASSIGNMENTS.animal: {
      const { animals } = Generator;
      dictionaries.push(animals);
      break;
    }
    case ASSIGNMENTS.color: {
      const { colors } = Generator;
      dictionaries.push(colors);
      break;
    }
    case ASSIGNMENTS.company:
      dictionaries.push(companies);
      break;
    case ASSIGNMENTS.country:
      dictionaries.push(countries);
      break;
    case ASSIGNMENTS.degreeBadge:
      dictionaries.push(degreeBadges);
      break;
    case ASSIGNMENTS.jobTitle:
      dictionaries.push(jobTitles);
      break;
    case ASSIGNMENTS.name: {
      const { names } = Generator;
      // names, twice for a first/last
      dictionaries.push(names);
      dictionaries.push(names);
      separator = ' ';
      length = 2;
      break;
    }
    case ASSIGNMENTS.timestamp:
      dictionaries.push(timestamps);
      break;
    default:
      return newRandomString;
  }

  // generate the random text
  newRandomString = uniqueNamesGenerator({
    dictionaries,
    length,
    separator,
    style,
  });

  return newRandomString;
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
   * @name randomText
   * @param {string} message The string containing the message to be logged.
   * @param {string} type The optional string declaring the type of log: error or normal (default).
   */
  randomText() {
    const assignmentData = this.textNode.getSharedPluginData(dataNamespace(), DATA_KEYS.assignment);
    const assignment: string = JSON.parse(assignmentData || null);
    let randomText: string = null;

    if (assignment) {
      randomText = generateRandom(assignment);
    }

    return randomText;
  }
}

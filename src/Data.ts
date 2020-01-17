import companies from './data/companies';
import countries from './data/countries';
import degreeBadges from './data/degree-badges';
import domainTLDs from './data/domain-tlds';
import jobTitles from './data/job-titles';
import names from './data/names';
import { getNodeAssignmentData } from './Tools';
import { ASSIGNMENTS } from './constants';

const Generator = require('unique-names-generator');

/** WIP
 * @description Takes a string message and logs it at one of 2 levels (normal or error).
 *
 * @kind function
 * @name getRandomInt
 * @param {string} message The string containing the message to be logged.
 * @param {string} type The optional string declaring the type of log: error or normal (default).
 */
const getRandomInt = (min, max): number => {
  const convertedMin = Math.ceil(min);
  const convertedMax = Math.floor(max);

  // The maximum is inclusive and the minimum is inclusive
  const randomInt: number = Math.floor(
    Math.random() * (convertedMax - convertedMin + 1),
  ) + convertedMin;
  return randomInt;
};

/** WIP
 * @description Takes a string message and logs it at one of 2 levels (normal or error).
 *
 * @kind function
 * @name generateTimestamp
 * @param {string} message The string containing the message to be logged.
 * @param {string} type The optional string declaring the type of log: error or normal (default).
 */
const generateTimestamp = (): string => {
  const timeDeclarations = ['mins', 'hrs', 'd', 'w', 'mo'];

  let randomTimeInteger = 0;
  const randomTimeDeclarationIndex = Math.floor(Math.random() * timeDeclarations.length);
  const randomTimeDeclaration = timeDeclarations[randomTimeDeclarationIndex];

  switch (randomTimeDeclaration) {
    case 'mins':
      randomTimeInteger = getRandomInt(1, 59);
      break;
    case 'hrs':
      randomTimeInteger = getRandomInt(1, 23);
      break;
    case 'd':
      randomTimeInteger = getRandomInt(1, 6);
      break;
    case 'w':
      randomTimeInteger = getRandomInt(1, 4);
      break;
    case 'mo':
      randomTimeInteger = getRandomInt(1, 6);
      break;
    default:
      return null;
  }

  const generatedStamp = `${randomTimeInteger} ${randomTimeDeclaration}`;
  return generatedStamp;
};

/** WIP
 * @description Generates a formatted, random date between now and `X` days in the future (set
 * as a constant in the function.
 *
 * @kind function
 * @name generateDate
 *
 * @returns {string} The formatted date as a string.
 */
const generateDate = (): string => {
  // set the upper bound for the random date
  const daysAhead = 120;
  const currentDate: Date = new Date();

  const addDaysToDate = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);

    return newDate;
  };

  const randomDate = (startDate: Date, days: number) => {
    const endDate = addDaysToDate(currentDate, days);
    const selectedDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()),
    );

    return selectedDate;
  };

  // months list
  const formattedMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  // pick a random date between now and the `daysAhead` upper bound
  const date: Date = randomDate(currentDate, daysAhead);

  // format the date for presentation
  const formattedMonth: string = formattedMonths[date.getMonth()];
  const formattedDate: number = date.getDate();
  const formattedYear: number = date.getFullYear();
  const generatedDate: string = `${formattedMonth} ${formattedDate} ${formattedYear}`;

  return generatedDate;
};

/** WIP
 * @description Generates a formatted, random date between now and `X` days in the future (set
 * as a constant in the function.
 *
 * @kind function
 * @name generateEmail
 *
 * @returns {string} The formatted date as a string.
 */
const generateDomain = (): string => {
  const { uniqueNamesGenerator } = Generator;

  let randomTLD = 'com';
  const weightedTLDPick = getRandomInt(1, 8);
  switch (weightedTLDPick) {
    case 5:
    case 6:
      randomTLD = 'org';
      break;
    case 7:
      randomTLD = 'net';
      break;
    case 8:
      randomTLD = uniqueNamesGenerator({
        dictionaries: [domainTLDs],
        length: 1,
        style: 'lowerCase',
      });
      break;
    default:
      randomTLD = 'com';
  }

  const randomCompany = uniqueNamesGenerator({
    dictionaries: [companies],
    length: 1,
  });

  const generatedDomain = `${randomCompany}.${randomTLD}`;
  return generatedDomain;
};

/** WIP
 * @description Generates a formatted, random date between now and `X` days in the future (set
 * as a constant in the function.
 *
 * @kind function
 * @name generateEmail
 *
 * @returns {string} The formatted date as a string.
 */
const generateEmail = (): string => {
  const { uniqueNamesGenerator } = Generator;
  const emailSeparators = ['.', '_'];
  const emailSeparatorIndex = getRandomInt(0, 1);

  const randomSeparator = emailSeparators[emailSeparatorIndex];

  const randomNameLength = getRandomInt(1, 2);
  const randomName = uniqueNamesGenerator({
    dictionaries: [names, names],
    length: randomNameLength,
    separator: randomSeparator,
    style: 'lowerCase',
  }).replace(' ', randomSeparator);

  const generatedEmail = `${randomName}@${generateDomain()}`;
  return generatedEmail;
};

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
  let style: 'lowerCase' | 'upperCase' | 'capital' = 'capital';
  let separator: string = null;
  let length: number = 1;
  let newRandomString = null;

  switch (assignment) {
    case ASSIGNMENTS.company:
      dictionaries.push(companies);
      break;
    case ASSIGNMENTS.country:
      dictionaries.push(countries);
      break;
    case ASSIGNMENTS.date: {
      const date = [generateDate()];
      dictionaries.push(date);
      break;
    }
    case ASSIGNMENTS.degreeBadge:
      dictionaries.push(degreeBadges);
      break;
    case ASSIGNMENTS.domain: {
      const domain = [generateDomain()];
      dictionaries.push(domain);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.email: {
      const email = [generateEmail()];
      dictionaries.push(email);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.jobTitle:
      dictionaries.push(jobTitles);
      break;
    case ASSIGNMENTS.name: {
      // names, twice for a first/last
      dictionaries.push(names);
      dictionaries.push(names);
      separator = ' ';
      length = 2;
      break;
    }
    case ASSIGNMENTS.timestamp: {
      const timestamp = [generateTimestamp()];
      dictionaries.push(timestamp);
      break;
    }
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
  randomText(forcedAssignment?: string) {
    let assignment: string = forcedAssignment;
    let randomText: string = null;
    if (!forcedAssignment) {
      const assignmentData = getNodeAssignmentData(this.textNode);
      assignment = JSON.parse(assignmentData || null);
    }

    if (assignment) {
      randomText = generateRandom(assignment);
    }

    return randomText;
  }
}

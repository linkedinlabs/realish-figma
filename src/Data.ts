import articleTitles from './data/article-titles';
import companies from './data/companies';
import countries from './data/countries';
import degreeBadges from './data/degree-badges';
import domainTLDs from './data/domain-tlds';
import events from './data/events';
import groups from './data/groups';
import industries from './data/industries';
import jobTitles from './data/job-titles';
import locations from './data/locations';
import mediaSources from './data/media-sources';
import names from './data/names';
import publications from './data/publications';
import schools from './data/schools';
import { getNodeAssignmentData } from './Tools';
import { ASSIGNMENTS } from './constants';

const Generator = require('unique-names-generator');

/**
 * @description Generate a random integer within a range (`min`/`max` inclusive).
 *
 * @kind function
 * @name getRandomInt
 *
 * @param {number} min The minimum number for the range (inclusive).
 * @param {number} max The maximum number for the range (inclusive).
 *
 * @returns {number} The generated number (`randomInt`).
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

// ------------------------------------------

/**
 * @description Generates a random number formatted as an alumni string
 * (i.e. “7 company alumni”) for either companies or schools. The number
 * of alumni is weighted toward lower numbers (under 20) and limited to 120.
 *
 * @kind function
 * @name generateAlumni
 *
 * @param {string} Alumni type (`school` or `company`)
 *
 * @returns {string} The formatted number of alumni.
 */
const generateAlumni = (type: 'company' | 'school'): string => {
  let randomNumber: number = 1;
  const weightedPick = getRandomInt(1, 8);
  switch (weightedPick) {
    case 3:
    case 4:
    case 5:
      randomNumber = getRandomInt(2, 20);
      break;
    case 6:
    case 7:
      randomNumber = getRandomInt(21, 50);
      break;
    case 8:
      randomNumber = getRandomInt(51, 120);
      break;
    default:
      randomNumber = 1;
  }

  const alumText = randomNumber === 1 ? 'alum' : 'alumni';
  const generatedAlumni = `${randomNumber} ${type} ${alumText}`;
  return generatedAlumni;
};

/**
 * @description Generates a random number formatted as a connections string
 * (i.e. “7 connections”). The number is weighted toward lower numbers (under 45)
 * and limited to 500 (or 225 for mutual connections).
 *
 * @kind function
 * @name generateConnections
 *
 * @param {string} Alumni type (`normal` or `mutual`)
 *
 * @returns {string} The formatted number of connections.
 */
const generateConnections = (type: 'mutual' | 'normal' = 'normal'): string => {
  let randomNumber: number = 1;
  let weightedPick = getRandomInt(1, 10);
  if (type === 'mutual') {
    weightedPick = getRandomInt(1, 8);
  }
  switch (weightedPick) {
    case 2:
    case 3:
      randomNumber = getRandomInt(2, 20);
      break;
    case 4:
    case 5:
    case 6:
    case 7:
      randomNumber = getRandomInt(21, 45);
      break;
    case 8:
      randomNumber = getRandomInt(46, 225);
      break;
    case 9:
      randomNumber = getRandomInt(226, 499);
      break;
    case 10:
      randomNumber = 500;
      break;
    default:
      randomNumber = 1;
  }

  const labelText = randomNumber === 1 ? 'connection' : 'connections';
  const labelPrefixText = type === 'mutual' ? ' mutual' : '';
  const numberSuffix = randomNumber === 500 ? '+' : '';
  const generatedConnections = `${randomNumber}${numberSuffix}${labelPrefixText} ${labelText}`;
  return generatedConnections;
};

/**
 * @description Generates a formatted, random date between now and `120` days in the future (set
 * as a constant in the function. Dates are formatted using the abbreviations in the
 * `formattedMonths` constant (i.e. “Jan 30, 2022”).
 *
 * @kind function
 * @name generateDate
 *
 * @returns {string} The formatted date as a string.
 */
const generateDate = (type: 'long' | 'short' = 'short'): string => {
  // set the upper bound for the random date
  const daysAhead = 120;
  const currentDate: Date = new Date();

  // returns a new date based on the `date` and number of `days` ahead
  const addDaysToDate = (date: Date, days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);

    return newDate;
  };

  // returns a random date between the supplied `startDate` and the `days` ahead
  const randomDate = (startDate: Date, days: number) => {
    const endDate = addDaysToDate(currentDate, days);
    const selectedDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()),
    );

    return selectedDate;
  };

  // month abbreviations lists
  const formattedMonthsLong = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const formattedMonthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  let formattedMonths = formattedMonthsLong;
  if (type === 'short') {
    formattedMonths = formattedMonthsShort;
  }

  // pick a random date between now and the `daysAhead` upper bound
  const date: Date = randomDate(currentDate, daysAhead);

  // format the date for presentation
  const formattedMonth: string = formattedMonths[date.getMonth()];
  const formattedDate: number = date.getDate();
  const formattedYear: number = date.getFullYear();

  let generatedDate: string = `${formattedMonth} ${formattedDate}, ${formattedYear}`;
  if (type === 'short') {
    generatedDate = `${formattedMonth} ${formattedDate}`;
  }

  return generatedDate;
};

/**
 * @description Generates a formatted, random domain name using the `companies` dataset.
 * The TLD is randomized, but weighted toward “.com” primarily, and then “.org”/“.net”
 * before picking from the `domainTLDs` dataset.
 *
 * @kind function
 * @name generateDomain
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

  const companyNames = [];
  companies.forEach(company => companyNames.push(company.name));
  const randomCompany = uniqueNamesGenerator({
    dictionaries: [companyNames],
    length: 1,
  }).replace(/[\W_]+/g, '');

  const generatedDomain = `${randomCompany}.${randomTLD}`;
  return generatedDomain;
};

/**
 * @description Generates a formatted, random email. The domain name is generated by the
 * `generateDomain` function, and the name is pulled and formatted from the `names` dataset.
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

/**
 * @description Generates a the filepath to a random image, based on assignment
 * (company or person).
 *
 * @kind function
 * @name generateFilepath
 *
 * @param {string} assignment The assignment used to generate a random filepath.
 *
 * @returns {string} The root filepath with filename.
 */
const generateFilepath = (
  assignment:
    'avatar-company'
    | 'avatar-event'
    | 'avatar-group'
    | 'avatar-media-source'
    | 'avatar-publication'
    | 'avatar-person'
    | 'avatar-school',
): string => {
  const { uniqueNamesGenerator } = Generator;
  let filepath = null;

  // non-person images are named the same as the data source names, but
  // set to lowercase – spaces are replaced with hyphens, ampersands are
  // replaced with the word “and”, other special characters are ignored
  if (assignment !== ASSIGNMENTS.avatarPerson.id) {
    let dataSet = null;
    let fileDirectory = `${assignment.replace('avatar-', '')}s`;

    switch (assignment) {
      case ASSIGNMENTS.avatarCompany.id:
        dataSet = companies;
        fileDirectory = 'companies';
        break;
      case ASSIGNMENTS.avatarEvent.id:
        dataSet = events;
        break;
      case ASSIGNMENTS.avatarGroup.id:
        dataSet = groups;
        break;
      case ASSIGNMENTS.avatarMediaSource.id:
        dataSet = mediaSources;
        break;
      case ASSIGNMENTS.avatarPublication.id:
        dataSet = publications;
        break;
      case ASSIGNMENTS.avatarSchool.id:
        dataSet = schools;
        break;
      default:
        dataSet = null;
    }

    if (dataSet) {
      const entriesWithImages = [];

      dataSet.forEach((entry) => {
        if (entry.hasImage) {
          entriesWithImages.push(entry.name);
        }
      });
      const randomEntryName = uniqueNamesGenerator({
        dictionaries: [entriesWithImages],
        length: 1,
        style: 'lowerCase',
      }).replace('&', 'and').replace(/[\s]/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

      filepath = `/${fileDirectory}/${randomEntryName}.png`;
    }
  }

  // first flip a coin betweena “woman” and “man”,
  // then pick a random image for the chosen grouping.
  // image sets for each group currently stop at 35.
  if (assignment === ASSIGNMENTS.avatarPerson.id) {
    const num = getRandomInt(0, 1);
    const randomSex: string = num === 0 ? 'woman' : 'man';
    const randomNumber: number = getRandomInt(1, 35);
    const formattedNumber: string = randomNumber < 10 ? `0${randomNumber}` : `${randomNumber}`;

    filepath = `/people/${randomSex}-${formattedNumber}.png`;
  }

  return filepath;
};

/**
 * @description Generate a random timestamp string from minutes to 6 months. The specific time
 * is formatted based on the length of time using the `timeDeclarations` abbreviation strings.
 *
 * @kind function
 * @name generateTimestamp
 *
 * @returns {string} The formatted timestamp (i.e. “6 m” or ”18 h”).
 */
const generateTimestamp = (): string => {
  const timeDeclarations = ['m', 'h', 'd', 'w', 'mo'];

  let randomTimeInteger = 0;
  const randomTimeDeclarationIndex = Math.floor(Math.random() * timeDeclarations.length);
  const randomTimeDeclaration = timeDeclarations[randomTimeDeclarationIndex];

  switch (randomTimeDeclaration) {
    case 'm':
      randomTimeInteger = getRandomInt(1, 59);
      break;
    case 'h':
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

  const generatedStamp = `${randomTimeInteger}${randomTimeDeclaration}`;
  return generatedStamp;
};

// ------------------------------------------

/**
 * @description Generates a random string based on the supplied `assignment`. In most cases
 * the assignment dictates the dictionaries that are loaded and the `uniqueNamesGenerator`
 * package generates the string. In other cases the random string is generated by another
 * helper function.
 *
 * @kind function
 * @name generateRandom
 *
 * @param {string} assignment The string containing the message to be logged.
 *
 * @returns {string} The random string, based on supplied `assignment`.
 */
const generateRandom = (assignment): string => {
  const { uniqueNamesGenerator } = Generator;
  const dictionaries = [];
  let style: 'lowerCase' | 'upperCase' | 'capital' = 'capital';
  let separator: string = null;
  let length: number = 1;
  let newRandomString = null;

  switch (assignment) {
    case ASSIGNMENTS.alumniCompany.id:
    case ASSIGNMENTS.alumniSchool.id: {
      const type = assignment.replace('alumni-', '');
      const alumniText = [generateAlumni(type)];
      dictionaries.push(alumniText);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.articleTitle.id:
      dictionaries.push(articleTitles);
      break;
    case ASSIGNMENTS.avatarCompany.id:
    case ASSIGNMENTS.avatarEvent.id:
    case ASSIGNMENTS.avatarGroup.id:
    case ASSIGNMENTS.avatarMediaSource.id:
    case ASSIGNMENTS.avatarPublication.id:
    case ASSIGNMENTS.avatarPerson.id:
    case ASSIGNMENTS.avatarSchool.id: {
      const filepath = [generateFilepath(assignment)];
      dictionaries.push(filepath);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.connections.id: {
      const connectionsText = [generateConnections()];
      dictionaries.push(connectionsText);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.connectionsMutual.id: {
      const connectionsText = [generateConnections('mutual')];
      dictionaries.push(connectionsText);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.company.id: {
      const companyNames = [];
      companies.forEach(company => companyNames.push(company.name));
      dictionaries.push(companyNames);
      break;
    }
    case ASSIGNMENTS.country.id:
      dictionaries.push(countries);
      break;
    case ASSIGNMENTS.date.id: {
      const date = [generateDate('long')];
      dictionaries.push(date);
      break;
    }
    case ASSIGNMENTS.dateShort.id: {
      const date = [generateDate('short')];
      dictionaries.push(date);
      break;
    }
    case ASSIGNMENTS.degreeBadge.id:
      dictionaries.push(degreeBadges);
      break;
    case ASSIGNMENTS.domain.id: {
      const domain = [generateDomain()];
      dictionaries.push(domain);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.email.id: {
      const email = [generateEmail()];
      dictionaries.push(email);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.event.id: {
      const eventNames = [];
      events.forEach(event => eventNames.push(event.name));
      dictionaries.push(eventNames);
      break;
    }
    case ASSIGNMENTS.group.id: {
      const groupNames = [];
      groups.forEach(group => groupNames.push(group.name));
      dictionaries.push(groupNames);
      break;
    }
    case ASSIGNMENTS.industry.id:
      dictionaries.push(industries);
      break;
    case ASSIGNMENTS.jobTitle.id:
      dictionaries.push(jobTitles);
      break;
    case ASSIGNMENTS.location.id:
      dictionaries.push(locations);
      break;
    case ASSIGNMENTS.mediaSource.id: {
      const mediaSourceNames = [];
      mediaSources.forEach(mediaSource => mediaSourceNames.push(mediaSource.name));
      dictionaries.push(mediaSourceNames);
      break;
    }
    case ASSIGNMENTS.name.id: {
      // names, twice for a first/last
      dictionaries.push(names);
      dictionaries.push(names);
      separator = ' ';
      length = 2;
      break;
    }
    case ASSIGNMENTS.publication.id: {
      const publicationNames = [];
      publications.forEach(publication => publicationNames.push(publication.name));
      dictionaries.push(publicationNames);
      break;
    }
    case ASSIGNMENTS.school.id: {
      const schoolNames = [];
      schools.forEach(school => schoolNames.push(school.name));
      dictionaries.push(schoolNames);
      break;
    }
    case ASSIGNMENTS.timestamp.id: {
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

/**
 * @description Manages the interface between the data sets and text nodes. Randomizes data
 * for a node’s `proposedText` through helper functions that generate the data or randomly
 * select from the supplied data sets.
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

  /**
   * @description Generates a random string based on an assigned type. The type may be supplied
   * directly (`forcedAssignment`) or retrieved from the node data using the
   * `getNodeAssignmentData` helper.
   *
   * @kind function
   * @name randomContent
   *
   * @param {string} forcedAssignment The string containing the message to be logged.
   *
   * @returns {string} The random string based on an assigned type.
   */
  randomContent(forcedAssignment?: string) {
    let assignment: string = forcedAssignment;
    let randomContent: string = null;
    if (!forcedAssignment) {
      const assignmentData = getNodeAssignmentData(this.textNode);
      assignment = JSON.parse(assignmentData || null);
    }

    if (assignment) {
      randomContent = generateRandom(assignment);
    }
    return randomContent;
  }
}

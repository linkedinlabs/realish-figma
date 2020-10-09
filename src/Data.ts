import articleTitles from './data/article-titles';
import companies from './data/companies';
import companiesMedia from './data/companies-media';
import countries from './data/countries';
import degreeBadges from './data/degree-badges';
import domainTLDs from './data/domain-tlds';
import events from './data/events';
import groups from './data/groups';
import hashtags from './data/hashtags';
import industries from './data/industries';
import jobTitles from './data/job-titles';
import locations from './data/locations';
import names from './data/names';
import newsletters from './data/newsletters';
import products from './data/products';
import schools from './data/schools';
import services from './data/services';
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

/**
 * @description Generate a formatted number, random, but within a weighted range.
 * Options include a starting point (`startingInt`), text (plural and singular),
 * and an array of break points and corresponding weights. A random integer is initially
 * picked within the weight range and then compared against the array of weights to
 * determine the range of numbers to randomly pick within.
 *
 * @kind function
 * @name generateWeightedNumber
 *
 * @param {Object} options The array (`breakCeilings`) requires at least one `weight`/`int` set;
 * Other options include `textPluralized` and `textSingular`, and a `startingInt` (optional).
 *
 * @returns {string} The generated, formatted number string.
 */
const generateWeightedNumber = (options: {
  breakCeilings: Array<{
    weight: number,
    int: number,
  }>,
  startingInt?: number,
  textPluralized: string,
  textSingular: string,
}): string => {
  const {
    breakCeilings,
    startingInt,
    textPluralized,
    textSingular,
  } = options;

  // set the weight ceiling
  let weightCeiling: number = 1;
  breakCeilings.forEach((breakItem) => {
    if (breakItem.weight > weightCeiling) {
      weightCeiling = breakItem.weight;
    }
  });

  // set the floor
  let randomNumber: number = 1;
  if (startingInt) {
    randomNumber = startingInt;
  }

  const weightedPick = getRandomInt(1, weightCeiling);

  // set the random integer
  let lastWeightUsed = 0;
  let lastCeilingUsed = randomNumber - 1;
  breakCeilings.forEach((breakItem) => {
    if (
      (weightedPick > lastWeightUsed)
      && (weightedPick <= breakItem.weight)
      && (breakItem.weight > lastWeightUsed)
    ) {
      const min = lastCeilingUsed + 1;
      const max = breakItem.int;
      randomNumber = getRandomInt(min, max);
    }
    lastWeightUsed = breakItem.weight;
    lastCeilingUsed = breakItem.int;
  });

  const stringText = randomNumber === 1 ? textSingular : textPluralized;
  const formattedNumber: string = randomNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const generatedString = `${formattedNumber} ${stringText}`;
  return generatedString;
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
 * @param {string} type Alumni type (`school` or `company`)
 *
 * @returns {string} The formatted number of alumni.
 */
const generateAlumni = (type: 'company' | 'school'): string => {
  const breakCeilingsArray = [
    { weight: 2, int: 1 },
    { weight: 5, int: 20 },
    { weight: 7, int: 50 },
    { weight: 8, int: 120 },
  ];

  const generatorOptions = {
    breakCeilings: breakCeilingsArray,
    textPluralized: `${type} alumni`,
    textSingular: `${type} alum`,
  };

  const generatedAlumni: string = generateWeightedNumber(generatorOptions);
  return generatedAlumni;
};

/**
 * @description Generates a random number formatted as a attendees count
 * (i.e. “543 attendees”). The number of attendees is weighted toward lower numbers
 * (under 500) and limited to 5,000. The formatted numbers are comma-spliced.
 *
 * @kind function
 * @name generateAttendees
 *
 * @returns {string} The formatted number of attendees.
 */
const generateAttendees = (): string => {
  const breakCeilingsArray = [
    { weight: 5, int: 500 },
    { weight: 8, int: 1500 },
    { weight: 9, int: 2500 },
    { weight: 10, int: 5000 },
  ];

  const generatorOptions = {
    breakCeilings: breakCeilingsArray,
    textPluralized: 'attendees',
    textSingular: 'attendee',
  };

  const generatedAttendees: string = generateWeightedNumber(generatorOptions);
  return generatedAttendees;
};

/**
 * @description Generates a random number formatted as a connections string
 * (i.e. “7 connections”). The number is weighted toward lower numbers (under 45)
 * and limited to 500 (or 225 for mutual connections).
 *
 * @kind function
 * @name generateConnections
 *
 * @param {string} type Alumni type (`normal` or `mutual`).
 *
 * @returns {string} The formatted number of connections.
 */
const generateConnections = (type: 'mutual' | 'normal' = 'normal'): string => {
  let breakCeilingsArray = [
    { weight: 1, int: 1 },
    { weight: 3, int: 20 },
    { weight: 7, int: 45 },
    { weight: 8, int: 225 },
    { weight: 9, int: 499 },
    { weight: 10, int: 500 },
  ];

  if (type === 'mutual') {
    breakCeilingsArray = [
      { weight: 1, int: 1 },
      { weight: 3, int: 20 },
      { weight: 7, int: 45 },
      { weight: 8, int: 225 },
    ];
  }

  const labelPrefixText = type === 'mutual' ? 'mutual ' : '';
  const generatorOptions = {
    breakCeilings: breakCeilingsArray,
    textPluralized: `${labelPrefixText}connections`,
    textSingular: `${labelPrefixText}connection`,
  };

  let generatedAttendees: string = generateWeightedNumber(generatorOptions);
  // add the “+” to 500
  generatedAttendees = generatedAttendees.replace('500', '500+');
  return generatedAttendees;
};

/**
 * @description Generates a formatted, random date between now and `120` days in the future (set
 * as a constant in the function. Dates are formatted using the abbreviations in the
 * `formattedMonths` constant (i.e. “Jan 30, 2022”).
 *
 * @kind function
 * @name generateDate
 *
 * @param {string} type The requested date format (`long` or `short`).
 * @param {boolean} withDay Set to `true` to include the day. Default is `false`.
 *
 * @returns {string} The formatted date as a string.
 */
const generateDate = (
  type: 'long' | 'short' = 'short',
  withDay: boolean = false,
): string => {
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

  // day abbreviations lists
  const formattedDaysLong = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];

  const formattedDaysShort = [
    'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
  ];

  let formattedDays = formattedDaysLong;
  if (type === 'short') {
    formattedDays = formattedDaysShort;
  }

  // pick a random date between now and the `daysAhead` upper bound
  const date: Date = randomDate(currentDate, daysAhead);

  // format the date for presentation
  const formattedDay: string = formattedDays[date.getDay()];
  const formattedMonth: string = formattedMonths[date.getMonth()];
  const formattedDate: number = date.getDate();
  const formattedYear: number = date.getFullYear();

  let generatedDate: string = `${formattedMonth} ${formattedDate}, ${formattedYear}`;
  if (withDay) {
    generatedDate = `${formattedDay}, ${formattedMonth} ${formattedDate}, ${formattedYear}`;
  }
  if (type === 'short') {
    generatedDate = `${formattedMonth} ${formattedDate}`;
    if (withDay) {
      generatedDate = `${formattedDay}, ${formattedMonth} ${formattedDate}`;
    }
  }

  return generatedDate;
};

/**
 * @description Generates a formatted, random date between now and `120` days in the future (set
 * as a constant in the function. Dates are formatted using the abbreviations in the
 * `formattedMonths` constant (i.e. “Jan 30, 2022”).
 *
 * @kind function
 * @name generateDateTime
 *
 * @returns {string} The formatted date as a string.
 */
const generateDateTime = (): string => {
  const dateShortDay = generateDate('short', true);

  // calculate a random time between 7am and 9pm (inclusive)
  const random30Interval = getRandomInt(0, 28);
  const initDate = new Date('2020/01/30 7:00 AM');
  const initTimestamp = initDate.getTime();
  const newTimestamp = initTimestamp + (random30Interval * 30 * 60000);
  const newDate = new Date(newTimestamp);

  // format time string
  let hours: number = newDate.getHours();
  const minutes: number = newDate.getMinutes();
  const amPm: string = hours >= 12 ? 'PM' : 'AM';
  const minutesString = minutes < 10 ? `0${minutes}` : minutes;
  hours %= 12;
  hours = hours > 0 ? hours : 12;
  const timeString = `${hours}:${minutesString} ${amPm}`;

  // combine/format the date with the time
  const generatedDateTime: string = `${dateShortDay}, ${timeString}`;
  return generatedDateTime;
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

  // pick a name to work with and make it lowercase
  const nameTextArray: Array<string> = [];
  names.forEach(name => nameTextArray.push(name.name));
  let randomName: string = uniqueNamesGenerator({
    dictionaries: [nameTextArray],
    style: 'lowerCase',
    length: 1,
  }).normalize('NFD');

  // set some params to format the email with
  const emailSeparators = ['.', '_', ''];
  const emailSeparatorIndex = getRandomInt(0, 2);
  const randomSeparator = emailSeparators[emailSeparatorIndex];
  const randomNameLength = getRandomInt(1, 2);

  // format the email
  if (randomNameLength === 1) {
    randomName = randomName.replace(' ', randomSeparator);
  } else {
    const nameArray = randomName.split(' ');
    const firstChar = nameArray[0].charAt(0);
    const lastName = nameArray[nameArray.length - 1];
    randomName = `${firstChar}${randomSeparator}${lastName}`;
  }

  // put the pieces together
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
    | 'avatar-company-media'
    | 'avatar-event'
    | 'avatar-group'
    | 'avatar-newsletter'
    | 'avatar-person'
    | 'avatar-product'
    | 'avatar-school'
    | 'avatar-service',
): string => {
  const { uniqueNamesGenerator } = Generator;
  let filepath = null;
  let dataSet = null;
  let fileDirectory = `${assignment.replace('avatar-', '')}s`;

  switch (assignment) {
    case ASSIGNMENTS.avatarCompany.id:
      dataSet = companies;
      fileDirectory = 'companies';
      break;
    case ASSIGNMENTS.avatarCompanyMedia.id:
      dataSet = companiesMedia;
      fileDirectory = 'companies-media';
      break;
    case ASSIGNMENTS.avatarEvent.id:
      dataSet = events;
      break;
    case ASSIGNMENTS.avatarGroup.id:
      dataSet = groups;
      break;
    case ASSIGNMENTS.avatarNewsletter.id:
      dataSet = newsletters;
      break;
    case ASSIGNMENTS.avatarPerson.id:
      dataSet = names;
      fileDirectory = 'people';
      break;
    case ASSIGNMENTS.avatarProduct.id:
      dataSet = products;
      break;
    case ASSIGNMENTS.avatarSchool.id:
      dataSet = schools;
      break;
    case ASSIGNMENTS.avatarService.id:
      dataSet = services;
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
    }).normalize('NFD')
      .replace('&', 'and')
      .replace(/[\s]/g, '-')
      .replace(/[^a-zA-Z0-9-]/g, '');

    filepath = `/${fileDirectory}/${randomEntryName}.png`;
  }

  return filepath;
};

/**
 * @description Generates a random number formatted as a followers count
 * (i.e. “543 followers”). The number of followers is weighted toward lower numbers
 * (under 1500) and limited to 2.1 million. The formatted numbers are comma-spliced.
 *
 * @kind function
 * @name generateFollowers
 *
 * @returns {string} The formatted number of attendees.
 */
const generateFollowers = (): string => {
  const breakCeilingsArray = [
    { weight: 2, int: 1 },
    { weight: 5, int: 500 },
    { weight: 7, int: 1500 },
    { weight: 9, int: 32000 },
    { weight: 10, int: 2100000 },
  ];

  const generatorOptions = {
    breakCeilings: breakCeilingsArray,
    textPluralized: 'followers',
    textSingular: 'follower',
  };

  const generatedFollowers: string = generateWeightedNumber(generatorOptions);
  return generatedFollowers;
};

/**
 * @description Generates a random hashtag by picking a base phrase and then applying
 * several weighted formatting options (uppercase, lowercase, or titlecase) and adding
 * the hash mark (#).
 *
 * @kind function
 * @name generateHashtag
 *
 * @returns {string} The formatted number of alumni.
 */
const generateHashtag = (): string => {
  const { uniqueNamesGenerator } = Generator;

  let hashtag: string = null;
  const weightedPick = getRandomInt(1, 8);

  const hashtagPhrase = uniqueNamesGenerator({
    dictionaries: [hashtags],
    length: 1,
  });
  hashtag = hashtagPhrase.replace(/\s+/g, '');

  switch (weightedPick) {
    case 1:
      hashtag = hashtag.toUpperCase();
      break;
    case 2:
    case 3:
    case 4:
      // title case; do nothing
      break;
    default:
      hashtag = hashtag.toLowerCase();
  }

  const generatedHashtag = `#${hashtag}`;
  return generatedHashtag;
};

/**
 * @description Generates a random number formatted as a members count
 * (i.e. “543 members”). The number of members is weighted toward lower numbers
 * (500-20,000) and limited to 250,000. The formatted numbers are comma-spliced.
 *
 * @kind function
 * @name generateMembers
 *
 * @returns {string} The formatted number of members.
 */
const generateMembers = (): string => {
  const breakCeilingsArray = [
    { weight: 2, int: 500 },
    { weight: 8, int: 20000 },
    { weight: 9, int: 175000 },
    { weight: 10, int: 250000 },
  ];

  const generatorOptions = {
    breakCeilings: breakCeilingsArray,
    textPluralized: 'members',
    textSingular: 'member',
  };

  const generatedMembers: string = generateWeightedNumber(generatorOptions);
  return generatedMembers;
};

/**
 * @description Generates a random profile headline from a few different variables.
 * Some headlines include a job title, a phrase, a company name, or a mixture of
 * all three. Some headlines are decorated with extra characters, others are not.
 *
 * @kind function
 * @name generateProfileHeadline
 *
 * @returns {string} The formatted number of alumni.
 */
const generateProfileHeadline = (): string => {
  const { uniqueNamesGenerator } = Generator;

  let phraseTitle: string = null;
  const weightedPick = getRandomInt(1, 5);
  const nonTitlePhrases: Array<string> = [
    'Author - Educator - Dreamer', 'Creating change through empathy', 'Creating Success Stories',
    'Creative Problem Solver', 'Doing the thing', 'Trying to be useful',
  ];

  const companyNames: Array<string> = [];
  companies.forEach(company => companyNames.push(company.name));
  const company = uniqueNamesGenerator({
    dictionaries: [companyNames],
    length: 1,
  });

  switch (weightedPick) {
    case 1:
      phraseTitle = uniqueNamesGenerator({
        dictionaries: [nonTitlePhrases],
        length: 1,
      });
      break;
    case 2: {
      const phrase = uniqueNamesGenerator({
        dictionaries: [nonTitlePhrases],
        length: 1,
      });
      const title = uniqueNamesGenerator({
        dictionaries: [jobTitles],
        length: 1,
      });

      phraseTitle = `${phrase} | ${title}`;
      break;
    }
    case 3:
    case 4:
    case 5:
      phraseTitle = uniqueNamesGenerator({
        dictionaries: [jobTitles],
        length: 1,
      });
      break;
    default:
      // do nothing
  }

  const decorationWeightedPick = getRandomInt(1, 10);
  const decorators: Array<string> = [
    '~', '@', '—', '|', '**',
  ];
  const decorator = uniqueNamesGenerator({
    dictionaries: [decorators],
    length: 1,
  });

  switch (decorationWeightedPick) {
    case 2:
      phraseTitle = `${decorator} ${phraseTitle} ${decorator}`;
      break;
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      phraseTitle = `${phraseTitle} ${decorator} ${company}`;
      break;
    case 8:
    case 9:
    case 10:
      phraseTitle = `${phraseTitle}, ${company}`;
      break;
    default:
      // do nothing
  }

  const generatedProfileHeadline = phraseTitle;
  return generatedProfileHeadline;
};

/**
 * @description Picks a publishing frequency weighted toward daily and monthly.
 *
 * @kind function
 * @name generatePublishedFrequency
 *
 * @returns {string} The formatted date as a string.
 */
const generatePublishedFrequency = (): string => {
  const { uniqueNamesGenerator } = Generator;
  const frequencies: Array<string> = [
    'weekly', 'biweekly', 'bimonthly', 'quarterly', 'yearly',
  ];

  let randomFrequency = 'daily';
  const weightedPick = getRandomInt(1, 8);
  switch (weightedPick) {
    case 3:
    case 4:
      randomFrequency = 'monthly';
      break;
    case 6:
    case 7:
    case 8:
      randomFrequency = uniqueNamesGenerator({
        dictionaries: [frequencies],
        length: 1,
        style: 'lowerCase',
      });
      break;
    default:
      randomFrequency = 'daily';
  }

  const generatedFrequency = `Published ${randomFrequency}`;
  return generatedFrequency;
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
  const separator: string = null;
  const length: number = 1;
  let style: 'lowerCase' | 'upperCase' | 'capital' = 'capital';
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
    case ASSIGNMENTS.attendees.id: {
      const attendeesText = [generateAttendees()];
      dictionaries.push(attendeesText);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.avatarCompany.id:
    case ASSIGNMENTS.avatarCompanyMedia.id:
    case ASSIGNMENTS.avatarEvent.id:
    case ASSIGNMENTS.avatarGroup.id:
    case ASSIGNMENTS.avatarNewsletter.id:
    case ASSIGNMENTS.avatarPerson.id:
    case ASSIGNMENTS.avatarProduct.id:
    case ASSIGNMENTS.avatarSchool.id:
    case ASSIGNMENTS.avatarService.id: {
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
      const companyNames: Array<string> = [];
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
    case ASSIGNMENTS.dateTime.id: {
      const dateTime = [generateDateTime()];
      dictionaries.push(dateTime);
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
    case ASSIGNMENTS.followers.id: {
      const followersText = [generateFollowers()];
      dictionaries.push(followersText);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.hashtag.id: {
      const hashtagText = [generateHashtag()];
      dictionaries.push(hashtagText);
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
    case ASSIGNMENTS.companyMedia.id: {
      const companyMediaNames = [];
      companiesMedia.forEach(companyMedia => companyMediaNames.push(companyMedia.name));
      dictionaries.push(companyMediaNames);
      break;
    }
    case ASSIGNMENTS.members.id: {
      const membersText = [generateMembers()];
      dictionaries.push(membersText);
      style = 'lowerCase';
      break;
    }
    case ASSIGNMENTS.name.id: {
      const nameNames = [];
      names.forEach(name => nameNames.push(name.name));
      dictionaries.push(nameNames);
      break;
    }
    case ASSIGNMENTS.newsletter.id: {
      const newsletterNames = [];
      newsletters.forEach(newsletter => newsletterNames.push(newsletter.name));
      dictionaries.push(newsletterNames);
      break;
    }
    case ASSIGNMENTS.product.id: {
      const productNames = [];
      products.forEach(product => productNames.push(product.name));
      dictionaries.push(productNames);
      break;
    }
    case ASSIGNMENTS.profileHeadline.id: {
      const profileHeadlineText = [generateProfileHeadline()];
      dictionaries.push(profileHeadlineText);
      break;
    }
    case ASSIGNMENTS.publishedFrequency.id: {
      const publishedFrequencyText = [generatePublishedFrequency()];
      dictionaries.push(publishedFrequencyText);
      break;
    }
    case ASSIGNMENTS.school.id: {
      const schoolNames = [];
      schools.forEach(school => schoolNames.push(school.name));
      dictionaries.push(schoolNames);
      break;
    }
    case ASSIGNMENTS.service.id: {
      const serviceNames = [];
      services.forEach(service => serviceNames.push(service.name));
      dictionaries.push(serviceNames);
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

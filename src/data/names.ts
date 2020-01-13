const Generator = require('unique-names-generator');

const { names, starWars } = Generator;

const starWarsSplit = [];
starWars.forEach((characterName) => {
  const splitNames = characterName.split(/(?=\s[A-Z])/);
  splitNames.forEach(splitName => starWarsSplit.push(splitName.trim()));
});

export default [
  ...names,
  ...starWarsSplit,
  'Grant',
  'Greg',
  'Gregory',
  'Nate',
  'Nathan',
];

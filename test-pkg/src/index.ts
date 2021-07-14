const helloWorld = (): void => {
  console.log('hello world'); // eslint-disable-line no-console
};

const isStringNullOrEmpty = (stringToEval: string): boolean => {
  const nullOrEmpty = stringToEval == null || stringToEval.trim().length === 0;
  return nullOrEmpty;
};

export {
  helloWorld,
  isStringNullOrEmpty,
};

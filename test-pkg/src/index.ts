const helloWorld = (): void => {
  console.log('hello world'); // eslint-disable-line no-console
};

const isStringNullOrEmpty = (string: string): boolean => {
  const nullOrEmpty = string == null || string.trim().length === 0;
  return nullOrEmpty;
};

export {
  helloWorld,
  isStringNullOrEmpty,
};

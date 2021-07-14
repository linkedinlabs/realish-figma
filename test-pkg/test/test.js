const { expect } = require('chai');
const { stub } = require('sinon');
const index = require('../dist/index.js');

describe('hello world test', () => {
  beforeEach(() => {
    stub(console, 'log');
  });

  afterEach(() => {
    console.log.restore(); // eslint-disable-line no-console
  });

  it('should call console.log', () => {
    index.helloWorld();
    expect(console.log.calledOnce).to.equal(true); // eslint-disable-line no-console
  });

  it('should print “hello world” in console.log', () => {
    index.helloWorld();
    expect(console.log.calledWith('hello world')).to.equal(true); // eslint-disable-line no-console
  });
});

describe('simple validate test', () => {
  it('should return true for null string', () => {
    const string = null;
    const result = index.isStringNullOrEmpty(string);
    expect(result).to.equal(true);
  });

  it('should return true for undefined string', () => {
    const string = undefined;
    const result = index.isStringNullOrEmpty(string);
    expect(result).to.equal(true);
  });

  it('should return true for empty string', () => {
    const string = '';
    const result = index.isStringNullOrEmpty(string);
    expect(result).to.equal(true);
  });

  it('should return true for whitespace string', () => {
    const string = ' ';
    const result = index.isStringNullOrEmpty(string);
    expect(result).to.equal(true);
  });

  it('should return false for non-empty string', () => {
    const string = 'test';
    const result = index.isStringNullOrEmpty(string);
    expect(result).to.equal(false);
  });
});

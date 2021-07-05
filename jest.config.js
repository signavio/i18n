/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
  reporters: [ "default", "jest-junit" ],
  coverageProvider: "babel",
  coverageReporters: [
    "lcov",
  ],
  testEnvironment: "jsdom",
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  transform: {
    '\\.po$': '<rootDir>/test/poFileTransformer.js',
    '\\.js$': 'babel-jest'
  },
};

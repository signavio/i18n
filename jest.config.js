/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',

  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  reporters: ["default", "jest-junit"],
  coverageReporters: [
    "lcov",
  ],
  testEnvironment: "jsdom",
  testMatch: [
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  transform: {
    '\\.po$': '<rootDir>/test/poFileTransformer.js',
    '\\.(j|t)s$': 'ts-jest'
  },
};

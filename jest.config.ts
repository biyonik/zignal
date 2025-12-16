/**
 * @fileoverview
 * TR: Jest test konfigürasyonu.
 * Angular 17+ ve jest-preset-angular kullanır.
 *
 * EN: Jest test configuration.
 * Uses Angular 17+ and jest-preset-angular.
 */

import type { Config } from 'jest';

const config: Config = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/public-api.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text', 'lcov'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@ANG-SIGNAL-FORMS/zignal$': '<rootDir>/src/public-api.ts',
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'html'],
  verbose: true,
};

export default config;

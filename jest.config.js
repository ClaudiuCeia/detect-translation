module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom-global',
  setupFilesAfterEnv: [
    '<rootDir>/setup-jest.ts'
  ],
};
module.exports = {
  testEnvironment: "<rootDir>/jest.environment.jsdom.js",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
};

module.exports = {
  testEnvironment: "<rootDir>/jest.environment.jsdom.js",
  setupFilesAfterEnv: ["<rootDir>/setup-jest.ts"],
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"],
  },
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.ts", "!src/test/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text-summary", "lcov"],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 80,
      functions: 90,
      lines: 90,
    },
    "./src/services/identifyIBMWatson.ts": {
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95,
    },
  },
};

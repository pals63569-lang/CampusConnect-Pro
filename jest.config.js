module.exports = {
  testEnvironment: "node",
  testTimeout: 10000,
  verbose: true,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
  ],
};

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    // Mock CSS imports
    '\\.(css|less|scss|sass)$': '<rootDir>/test/__mocks__/styleMock.js',
    // Mock static files
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/test/__mocks__/fileMock.js',
  },
  collectCoverageFrom: [
    'src/components/**/*.{js,jsx}',
    'src/context/**/*.{js,jsx}',
    'src/pages/**/*.{js,jsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

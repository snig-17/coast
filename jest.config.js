module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  moduleNameMapper: {
    '^@coast/core$': '<rootDir>/packages/core/src',
    '^@coast/engine$': '<rootDir>/packages/engine/src',
  },
};

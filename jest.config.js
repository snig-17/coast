module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  moduleNameMapper: {
    '^@coast/core$': '<rootDir>/packages/core/src',
    '^@coast/engine$': '<rootDir>/packages/engine/src',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
};

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps/mobile/src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  modulePathIgnorePatterns: ['<rootDir>/packages/core/dist/', '<rootDir>/packages/engine/dist/'],
  moduleNameMapper: {
    '^@coast/core$': '<rootDir>/packages/core/src',
    '^@coast/engine$': '<rootDir>/packages/engine/src',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
};

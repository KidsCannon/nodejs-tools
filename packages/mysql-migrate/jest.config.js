module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest-setup.ts'],
  testTimeout: 50000,
  testRegex: '.+\\.(test|spec)\\.ts$',
}

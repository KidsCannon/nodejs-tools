module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest-setup.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
}

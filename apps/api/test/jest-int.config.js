/**
 * Jest config cho integration test (chạy với PostgreSQL thật).
 * DATABASE_URL mặc định trỏ tới database brewlite_test; CI cung cấp qua service container.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL ??= 'postgresql://brewlite:brewlite@localhost:5432/brewlite_test?schema=public';
process.env.JWT_SECRET ??= 'integration-test-secret-0123456789';
process.env.PAYMENT_LATENCY_MS = '0';
process.env.PAYMENT_FAILURE_RATE = '0';

module.exports = {
  rootDir: '..',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: 'test/.*\\.int-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  globalSetup: '<rootDir>/test/global-setup.js',
  testTimeout: 60000,
};

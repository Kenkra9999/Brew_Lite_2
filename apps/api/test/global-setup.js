/* Áp dụng migration lên database test (tái tạo CSDL từ đầu - NFR khả năng tái lập). */
const { execSync } = require('node:child_process');
const path = require('node:path');

module.exports = async () => {
  const url = process.env.DATABASE_URL;
  const databaseName = decodeURIComponent(new URL(url).pathname.slice(1));
  if (!/^[A-Za-z0-9_]+_test$/.test(databaseName)) {
    throw new Error('Refusing to reset a database without an explicit _test suffix');
  }
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'inherit',
  });
};

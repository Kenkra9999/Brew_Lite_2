import { validateEnv } from './env.validation';

describe('validateEnv (UNIT-T06 - NFR cấu hình)', () => {
  const valid = { DATABASE_URL: 'postgresql://u:p@localhost:5432/db', JWT_SECRET: 'a-very-long-secret-value' };

  it('áp dụng giá trị mặc định', () => {
    const env = validateEnv(valid);
    expect(env.PORT).toBe(3001);
    expect(env.JWT_EXPIRES_IN).toBe('1d');
    expect(env.PAYMENT_FAILURE_RATE).toBe(0);
  });

  it('fail fast khi thiếu DATABASE_URL / JWT_SECRET', () => {
    expect(() => validateEnv({})).toThrow(/DATABASE_URL is required.*JWT_SECRET is required/);
  });

  it('từ chối JWT_SECRET quá ngắn và tỉ lệ lỗi ngoài [0,1]', () => {
    expect(() => validateEnv({ ...valid, JWT_SECRET: 'short' })).toThrow(/at least 16/);
    expect(() => validateEnv({ ...valid, PAYMENT_FAILURE_RATE: '2' })).toThrow(/\[0,1\]/);
  });
});

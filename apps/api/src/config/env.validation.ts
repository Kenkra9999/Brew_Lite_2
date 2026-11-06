/**
 * Kiểm tra biến môi trường khi khởi động (fail fast nếu thiếu cấu hình).
 * Quản lý cấu hình theo 12-factor: mọi cấu hình đến từ env, không hard-code secret.
 */
export interface AppEnv {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  PAYMENT_LATENCY_MS: number;
  PAYMENT_FAILURE_RATE: number;
  APP_VERSION: string;
}

export function validateEnv(raw: Record<string, unknown>): AppEnv {
  const errors: string[] = [];
  const str = (key: string, fallback?: string): string => {
    const v = raw[key];
    if (typeof v === 'string' && v.length > 0) return v;
    if (fallback !== undefined) return fallback;
    errors.push(`${key} is required`);
    return '';
  };
  const num = (key: string, fallback: number): number => {
    const v = raw[key];
    if (v === undefined || v === '') return fallback;
    const n = Number(v);
    if (Number.isNaN(n)) errors.push(`${key} must be a number`);
    return n;
  };

  const env: AppEnv = {
    NODE_ENV: str('NODE_ENV', 'development'),
    PORT: num('PORT', 3001),
    DATABASE_URL: str('DATABASE_URL'),
    JWT_SECRET: str('JWT_SECRET'),
    JWT_EXPIRES_IN: str('JWT_EXPIRES_IN', '1d'),
    CORS_ORIGIN: str('CORS_ORIGIN', 'http://localhost:3000'),
    PAYMENT_LATENCY_MS: num('PAYMENT_LATENCY_MS', 300),
    PAYMENT_FAILURE_RATE: num('PAYMENT_FAILURE_RATE', 0),
    APP_VERSION: str('APP_VERSION', 'dev'),
  };

  if (env.JWT_SECRET && env.JWT_SECRET.length < 16) errors.push('JWT_SECRET must be at least 16 characters');
  if (env.PAYMENT_FAILURE_RATE < 0 || env.PAYMENT_FAILURE_RATE > 1) errors.push('PAYMENT_FAILURE_RATE must be in [0,1]');
  if (errors.length) throw new Error(`Invalid environment: ${errors.join('; ')}`);
  return env;
}

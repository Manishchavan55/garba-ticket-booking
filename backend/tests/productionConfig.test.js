import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const envForProduction = (overrides = {}) => ({
  ...process.env,
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://www.kesariyadandiya.example',
  PHONEPE_ENVIRONMENT: 'PRODUCTION',
  PHONEPE_REDIRECT_URL: 'https://www.kesariyadandiya.example/payment/result',
  ...overrides,
});

const loadConfig = (env) => spawnSync(
  process.execPath,
  ['--input-type=module', '-e', "import './src/config/env.js';"],
  {
    cwd: process.cwd(),
    env,
    encoding: 'utf8',
  },
);

describe('production configuration guardrails', () => {
  it('refuses to start production with sandbox PhonePe configuration', () => {
    const result = loadConfig(envForProduction({ PHONEPE_ENVIRONMENT: 'SANDBOX' }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('PHONEPE_ENVIRONMENT=PRODUCTION');
  });

  it('refuses to start production with a non-HTTPS PhonePe redirect URL', () => {
    const result = loadConfig(envForProduction({ PHONEPE_REDIRECT_URL: 'http://www.kesariyadandiya.example/payment/result' }));

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('HTTPS PHONEPE_REDIRECT_URL');
  });

  it('accepts production payment and origin configuration when HTTPS is used', () => {
    const result = loadConfig(envForProduction());

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });
});

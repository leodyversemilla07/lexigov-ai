import * as Sentry from '@sentry/nestjs';

/**
 * Initialize Sentry for error tracking.
 * Only activates when `SENTRY_DSN` is set (production / staging).
 * Returns `true` if Sentry was initialized.
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  });

  return true;
}

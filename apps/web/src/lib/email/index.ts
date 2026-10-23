/**
 * Email Service
 * Centralized factory that selects the email provider based on environment
 * variables and exposes a `send` helper used by Better Auth hooks.
 */
import { ConsoleEmailProvider } from './providers/console';
import { ResendEmailProvider } from './providers/resend';
import type { EmailMessage, EmailProvider, EmailSendResult } from './types';

let cachedProvider: EmailProvider | null = null;

function buildProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = (process.env.EMAIL_PROVIDER ?? 'console').toLowerCase();
  const fromAddress = process.env.EMAIL_FROM ?? 'LexiGov AI <no-reply@lexigov.example>';

  if (providerName === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend in production.');
      }
      console.warn('[email] EMAIL_PROVIDER=resend but RESEND_API_KEY is missing — using console provider in development.');
      cachedProvider = new ConsoleEmailProvider();
      return cachedProvider;
    }
    cachedProvider = new ResendEmailProvider(apiKey, fromAddress);
    return cachedProvider;
  }

  if (providerName !== 'console') throw new Error(`Unsupported EMAIL_PROVIDER: ${providerName}`);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('EMAIL_PROVIDER=console is disabled in production. Configure a transactional email provider.');
  }
  cachedProvider = new ConsoleEmailProvider();
  return cachedProvider;
}

export type { EmailMessage, EmailProvider, EmailSendResult } from './types';

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const provider = buildProvider();
  const result = await provider.send(message);
  if (!result.success) throw new Error(result.error || `${provider.name} failed to deliver email.`);
  return result;
}

export function getEmailProviderName(): string {
  return buildProvider().name;
}

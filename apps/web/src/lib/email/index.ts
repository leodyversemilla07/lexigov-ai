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
      // eslint-disable-next-line no-console
      console.warn('[email] EMAIL_PROVIDER=resend but RESEND_API_KEY is missing — falling back to console provider.');
      cachedProvider = new ConsoleEmailProvider();
      return cachedProvider;
    }
    cachedProvider = new ResendEmailProvider(apiKey, fromAddress);
    return cachedProvider;
  }

  cachedProvider = new ConsoleEmailProvider();
  return cachedProvider;
}

export type { EmailMessage, EmailProvider, EmailSendResult } from './types';

export async function sendEmail(message: EmailMessage): Promise<EmailSendResult> {
  const provider = buildProvider();
  return provider.send(message);
}

export function getEmailProviderName(): string {
  return buildProvider().name;
}

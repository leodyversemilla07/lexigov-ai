/**
 * Resend Email Provider
 * https://resend.com — simple transactional email API.
 *
 * Configure with:
 *   EMAIL_PROVIDER=resend
 *   RESEND_API_KEY=re_...
 *   EMAIL_FROM="LexiGov AI <no-reply@yourdomain.com>"
 */
import type { EmailMessage, EmailProvider, EmailSendResult } from '../types';

interface ResendResponse {
  id?: string;
  error?: { message?: string };
}

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly fromAddress: string,
  ) {}

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const from = message.from ?? this.fromAddress;
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          reply_to: message.replyTo,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as ResendResponse;
      if (!response.ok) {
        return {
          success: false,
          error: body.error?.message ?? `Resend returned status ${response.status}`,
        };
      }
      return { success: true, id: body.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Resend error',
      };
    }
  }
}

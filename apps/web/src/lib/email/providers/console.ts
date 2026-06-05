/**
 * Console Email Provider
 * Default provider used in development / when no email service is configured.
 * Logs the message to stdout so links remain copy-pasteable in dev.
 */
import type { EmailMessage, EmailProvider, EmailSendResult } from '../types';

export class ConsoleEmailProvider implements EmailProvider {
  readonly name = 'console';

  async send(message: EmailMessage): Promise<EmailSendResult> {
    const boundary = '─'.repeat(60);
    // eslint-disable-next-line no-console
    console.log(
      [
        boundary,
        `[email:console] to=${message.to}`,
        `[email:console] subject=${message.subject}`,
        message.text ? `[email:console] text=${message.text}` : null,
        `[email:console] html=${message.html}`,
        boundary,
      ]
        .filter(Boolean)
        .join('\n'),
    );
    return { success: true, id: `console-${Date.now()}` };
  }
}

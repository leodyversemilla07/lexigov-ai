/**
 * Email Templates
 * Self-contained, accessible HTML+text templates for auth lifecycle emails.
 * No external template engine — keeps the bundle small and the output predictable.
 */

const BRAND = {
  name: 'LexiGov AI',
  tagline: 'RA 7160-aware ordinance drafting',
  primary: '#1f2937',
  accent: '#2563eb',
  surface: '#f8fafc',
  text: '#0f172a',
  muted: '#475569',
};

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.surface};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${BRAND.surface};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
          <tr>
            <td style="padding:24px 32px;background:${BRAND.primary};color:#ffffff;">
              <div style="font-size:18px;font-weight:600;letter-spacing:-0.01em;">${BRAND.name}</div>
              <div style="font-size:12px;opacity:0.8;margin-top:2px;">${BRAND.tagline}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-size:15px;line-height:1.6;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;font-size:12px;color:${BRAND.muted};border-top:1px solid #e2e8f0;">
              You received this email because you have an account on ${BRAND.name}. If you did not request this, you can safely ignore the message.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td style="background:${BRAND.accent};border-radius:8px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 20px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:${BRAND.muted};word-break:break-all;">Or copy and paste this link into your browser:<br /><a href="${escapeHtml(url)}" style="color:${BRAND.accent};">${escapeHtml(url)}</a></p>`;
}

export function renderEmailVerification({ name, url }: { name?: string; url: string }) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const subject = 'Verify your LexiGov AI email address';
  const html = shell(
    subject,
    `<p>${greeting}</p>
         <p>Welcome to ${BRAND.name}. Please confirm your email address so we can activate your account.</p>
         ${ctaButton(url, 'Verify email')}
         <p>This link expires in 1 hour. If you didn't create a ${BRAND.name} account, you can disregard this email.</p>`,
  );
  const text = `${greeting}\n\nWelcome to ${BRAND.name}. Please confirm your email address by visiting:\n${url}\n\nThis link expires in 1 hour.`;
  return { subject, html, text };
}

export function renderPasswordReset({ name, url }: { name?: string; url: string }) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const subject = 'Reset your LexiGov AI password';
  const html = shell(
    subject,
    `<p>${greeting}</p>
         <p>We received a request to reset the password for your ${BRAND.name} account. Click the button below to choose a new one.</p>
         ${ctaButton(url, 'Reset password')}
         <p>This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>`,
  );
  const text = `${greeting}\n\nReset your ${BRAND.name} password by visiting:\n${url}\n\nThis link expires in 1 hour. If you did not request a reset, you can ignore this email.`;
  return { subject, html, text };
}

export function renderOrganizationInvitation({
  organizationName,
  inviterName,
  roleLabel,
  url,
}: {
  organizationName: string;
  inviterName: string;
  roleLabel: string;
  url: string;
}) {
  const subject = `Invitation to join ${organizationName} on LexiGov AI`;
  const html = shell(
    subject,
    `<p>${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(organizationName)}</strong> as ${escapeHtml(roleLabel)}.</p>
         <p>Accept only if you recognize the organization and expected this invitation. Workspace roles control access inside LexiGov but do not establish public office or legal authority.</p>
         ${ctaButton(url, 'Review invitation')}
         <p>This invitation expires. If you did not expect it, you can ignore this email.</p>`,
  );
  const text = `${inviterName} invited you to join ${organizationName} as ${roleLabel} on LexiGov AI. Workspace roles do not establish public office or legal authority. Review the invitation:\n${url}`;
  return { subject, html, text };
}

export function renderTwoFactorCode({ name, code }: { name?: string; code: string }) {
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const subject = `${code} is your LexiGov AI verification code`;
  const html = shell(
    subject,
    `<p>${greeting}</p>
         <p>Use the verification code below to complete your sign-in to ${BRAND.name}:</p>
         <div style="margin:24px 0;padding:16px 24px;background:${BRAND.surface};border:1px dashed #cbd5e1;border-radius:8px;text-align:center;font-size:28px;font-weight:700;letter-spacing:0.4em;color:${BRAND.text};">${escapeHtml(code)}</div>
         <p>This code expires in 10 minutes. If you didn't try to sign in, please secure your account.</p>`,
  );
  const text = `${greeting}\n\nYour ${BRAND.name} verification code is: ${code}\n\nThis code expires in 10 minutes.`;
  return { subject, html, text };
}

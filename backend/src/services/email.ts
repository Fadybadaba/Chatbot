import nodemailer from 'nodemailer';

export interface ApprovalEmailParams {
  to: string;
  jobTitle: string;
}

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

function createTransport() {
  const host = getEnv('SMTP_HOST');
  const port = getEnv('SMTP_PORT');
  const user = getEnv('SMTP_USER');
  const pass = getEnv('SMTP_PASS');

  // If SMTP isn't configured, use a dev transport that doesn't send anything
  // but still produces the full email content in logs.
  if (!host || !port || !user || !pass) {
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  return nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass },
  });
}

export async function sendApprovedEmail(params: ApprovalEmailParams): Promise<{
  sent: boolean;
  messageId?: string;
}> {
  const transporter = createTransport();

  const from =
    getEnv('MAIL_FROM') || getEnv('SMTP_USER') || 'no-reply@example.com';

  const subject = `Application update: ${params.jobTitle}`;
  const text =
    `Hello,\n\n` +
    `✅ You are APPROVED for the first step for the role: ${params.jobTitle}.\n` +
    `🎉 Congratulations!\n` +
    `Our HR department will contact you soon with the next steps.\n\n` +
    `Best regards,\n` +
    `HR Team\n`;

  const info = await transporter.sendMail({
    from,
    to: params.to,
    subject,
    text,
  });

  const isDev = (transporter as any).options?.streamTransport === true;
  if (isDev) {
    // Log the generated message so you can verify it works without SMTP.
    // eslint-disable-next-line no-console
    const raw = (info as any).message;
    if (raw) {
      // eslint-disable-next-line no-console
      console.log('[dev-email] Generated approval email:\n' + raw.toString());
    }
    return { sent: false, messageId: info.messageId };
  }

  return { sent: true, messageId: info.messageId };
}


import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST.replace(/[\r\n]/g, ""),
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

function sanitizeMailHeader(value: string) {
  return value.replace(/[\r\n]/g, " ").trim();
}

export async function sendPlatformEmail(payload: EmailPayload) {
  const from = sanitizeMailHeader(
    process.env.EMAIL_FROM || "العمق النجفي <noreply@example.com>",
  );
  const to = sanitizeMailHeader(payload.to);
  const subject = sanitizeMailHeader(payload.subject);

  if (resend) {
    return resend.emails.send({
      from,
      to,
      subject,
      html: payload.html,
    });
  }

  if (transporter) {
    return transporter.sendMail({
      from,
      to,
      subject,
      html: payload.html,
    });
  }

  return { skipped: true };
}

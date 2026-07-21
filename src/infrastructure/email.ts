import nodemailer, { type Transporter } from "nodemailer";
import {
  smtpFromEmail,
  smtpHost,
  smtpPassword,
  smtpPort,
  smtpSecure,
  smtpUser,
} from "@/env";

let transporter: Transporter | undefined;

function getTransporter() {
  if (!smtpHost || !smtpUser || !smtpPassword) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
    );
  }

  transporter ??= nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  return transporter;
}

export const escapeEmailHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export const toEmailSubjectLine = (value: string) =>
  value.replace(/[\r\n]+/g, " ").trim();

type SendEmailInput = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput) {
  await getTransporter().sendMail({
    from: smtpFromEmail ?? smtpUser,
    ...input,
  });
}

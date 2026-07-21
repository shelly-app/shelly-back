import nodemailer, { type Transporter } from "nodemailer";
import type { ContactSubmission } from "@/db/schema";
import {
  contactRecipientEmail,
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
      "Contact email is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD.",
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

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const singleLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

export async function sendContactSubmissionEmail(
  submission: ContactSubmission,
) {
  if (!contactRecipientEmail) {
    throw new Error(
      "Contact email is not configured. Set CONTACT_RECIPIENT_EMAIL.",
    );
  }

  const isShelterRequest = submission.type === "shelter";
  const typeLabel = isShelterRequest
    ? "Solicitud de acceso de refugio"
    : "Propuesta de patrocinio";
  const subjectName =
    (isShelterRequest ? submission.shelterName : submission.organization) ||
    submission.name;
  const fields: Array<[string, string | null]> = [
    ["Nombre", submission.name],
    ["Correo electrónico", submission.email],
    ["Teléfono", submission.phone],
    ["Organización", submission.organization],
    ...(isShelterRequest
      ? ([
          ["Nombre del refugio", submission.shelterName],
          ["Ubicación del refugio", submission.shelterLocation],
          ["Tipo de refugio", submission.shelterType],
        ] satisfies Array<[string, string | null]>)
      : []),
    ["Mensaje", submission.message],
  ];
  const populatedFields = fields.filter((field): field is [string, string] =>
    Boolean(field[1]),
  );
  const text = populatedFields
    .map(([label, value]) => `${label}:\n${value}`)
    .join("\n\n");
  const html = `
    <h2>${escapeHtml(typeLabel)}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:680px">
      ${populatedFields
        .map(
          ([label, value]) => `
            <tr>
              <th style="padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid #ddd">
                ${escapeHtml(label)}
              </th>
              <td style="padding:8px;border-bottom:1px solid #ddd">
                ${escapeHtml(value).replaceAll("\n", "<br>")}
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;

  await getTransporter().sendMail({
    from: smtpFromEmail ?? smtpUser,
    to: contactRecipientEmail,
    replyTo: submission.email,
    subject: `[Shelly] ${typeLabel}: ${singleLine(subjectName)}`,
    text,
    html,
  });
}

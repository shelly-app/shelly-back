import type { ContactSubmission } from "@/db/schema";
import { contactRecipientEmail } from "@/env";
import {
  escapeEmailHtml,
  sendEmail,
  toEmailSubjectLine,
} from "@/infrastructure/email";

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
    <h2>${escapeEmailHtml(typeLabel)}</h2>
    <table style="border-collapse:collapse;width:100%;max-width:680px">
      ${populatedFields
        .map(
          ([label, value]) => `
            <tr>
              <th style="padding:8px;text-align:left;vertical-align:top;border-bottom:1px solid #ddd">
                ${escapeEmailHtml(label)}
              </th>
              <td style="padding:8px;border-bottom:1px solid #ddd">
                ${escapeEmailHtml(value).replaceAll("\n", "<br>")}
              </td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;

  await sendEmail({
    to: contactRecipientEmail,
    replyTo: submission.email,
    subject: `[Shelly] ${typeLabel}: ${toEmailSubjectLine(subjectName)}`,
    text,
    html,
  });
}

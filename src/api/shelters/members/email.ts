import { appPublicUrl } from "@/env";
import {
  escapeEmailHtml,
  sendEmail,
  toEmailSubjectLine,
} from "@/infrastructure/email";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  volunteer: "Voluntario",
};

export async function sendMemberInvitationEmail(input: {
  email: string;
  shelterName: string;
  role: string;
}) {
  if (!appPublicUrl) {
    throw new Error(
      "Member invitations are not configured. Set APP_PUBLIC_URL.",
    );
  }

  const invitationUrl = `${appPublicUrl}/auth/sign-in?redirectTo=${encodeURIComponent("/app")}`;
  const roleLabel = ROLE_LABELS[input.role] ?? input.role;
  const safeShelterName = escapeEmailHtml(input.shelterName);
  const safeRole = escapeEmailHtml(roleLabel);
  const safeInvitationUrl = escapeEmailHtml(invitationUrl);
  const subject = `[Shelly] Te invitaron a ${toEmailSubjectLine(input.shelterName)}`;
  const text = [
    `Te invitaron a formar parte de ${input.shelterName} en Shelly.`,
    `Tu rol será: ${roleLabel}.`,
    "Para aceptar la invitación, iniciá sesión con esta misma dirección de correo:",
    invitationUrl,
  ].join("\n\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#292524;max-width:600px">
      <h2>Te invitaron a ${safeShelterName}</h2>
      <p>
        Fuiste invitado/a a formar parte de <strong>${safeShelterName}</strong>
        en Shelly con el rol de <strong>${safeRole}</strong>.
      </p>
      <p>
        Iniciá sesión con esta misma dirección de correo para aceptar la
        invitación y acceder al refugio.
      </p>
      <p style="margin:24px 0">
        <a
          href="${safeInvitationUrl}"
          style="display:inline-block;padding:12px 20px;border-radius:6px;background:#f59e0b;color:#ffffff;text-decoration:none;font-weight:600"
        >
          Aceptar invitación
        </a>
      </p>
      <p style="font-size:12px;color:#78716c">
        Si no esperabas esta invitación, podés ignorar este mensaje.
      </p>
    </div>
  `;

  await sendEmail({
    to: input.email,
    subject,
    text,
    html,
  });
}

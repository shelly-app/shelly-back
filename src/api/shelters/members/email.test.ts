import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendMemberInvitationEmail } from "@/api/shelters/members/email";
import { sendEmail } from "@/infrastructure/email";

vi.mock("@/env", () => ({
  appPublicUrl: "https://shelly.example.com",
}));

vi.mock("@/infrastructure/email", () => ({
  escapeEmailHtml: (value: string) => value,
  toEmailSubjectLine: (value: string) => value,
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

describe("shelters/members/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a Spanish invitation with the shelter and assigned role", async () => {
    await sendMemberInvitationEmail({
      email: "volunteer@example.com",
      shelterName: "Patitas Felices",
      role: "volunteer",
    });

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "volunteer@example.com",
        subject: "[Shelly] Te invitaron a Patitas Felices",
        text: expect.stringContaining("Tu rol será: Voluntario."),
        html: expect.stringContaining("Aceptar invitación"),
      }),
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining(
          "https://shelly.example.com/auth/sign-in?redirectTo=%2Fapp",
        ),
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendContactSubmissionEmail } from "@/api/contact/email";
import type { ContactSubmission } from "@/db/schema";

const { createTransport, sendMail } = vi.hoisted(() => ({
  createTransport: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport,
  },
}));

vi.mock("@/env", () => ({
  smtpHost: "smtp.gmail.com",
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: "sender@example.com",
  smtpPassword: "app-password",
  smtpFromEmail: "sender@example.com",
  contactRecipientEmail: "support@example.com",
}));

describe("contact/email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createTransport.mockReturnValue({ sendMail });
    sendMail.mockResolvedValue({ messageId: "message-1" });
  });

  it("sends shelter requests to support with reply-to configured", async () => {
    const submission = {
      id: 1,
      type: "shelter",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "+54 11 5555-5555",
      organization: null,
      message: "We would like to join Shelly.",
      shelterName: "Happy Paws",
      shelterLocation: "Córdoba",
      shelterType: "Nonprofit",
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deletedAt: null,
    } satisfies ContactSubmission;

    await sendContactSubmissionEmail(submission);

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "sender@example.com",
        pass: "app-password",
      },
    });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "sender@example.com",
        to: "support@example.com",
        replyTo: "jane@example.com",
        subject: "[Shelly] Solicitud de acceso de refugio: Happy Paws",
        text: expect.stringContaining("We would like to join Shelly."),
        html: expect.stringContaining("Córdoba"),
      }),
    );
  });

  it("escapes user-provided HTML in sponsorship proposals", async () => {
    const submission = {
      id: 2,
      type: "sponsor",
      name: "John Doe",
      email: "john@example.com",
      phone: null,
      organization: "<Acme>",
      message: "<script>alert('test')</script>",
      shelterName: null,
      shelterLocation: null,
      shelterType: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deletedAt: null,
    } satisfies ContactSubmission;

    await sendContactSubmissionEmail(submission);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "[Shelly] Propuesta de patrocinio: <Acme>",
        html: expect.not.stringContaining("<script>"),
      }),
    );
  });
});

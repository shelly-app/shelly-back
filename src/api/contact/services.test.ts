import { beforeEach, describe, expect, it, vi } from "vitest";
import { sendContactSubmissionEmail } from "@/api/contact/email";
import * as repository from "@/api/contact/repository";
import { createContactSubmission } from "@/api/contact/services";

vi.mock("@/api/contact/email", () => ({
  sendContactSubmissionEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/api/contact/repository", () => ({
  create: vi.fn(),
}));

describe("contact/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("stores and emails a shelter request", async () => {
    const created = {
      id: 1,
      type: "shelter",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: null,
      organization: null,
      message: "We would like to join Shelly.",
      shelterName: "Happy Paws",
      shelterLocation: "Córdoba",
      shelterType: "Nonprofit",
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deletedAt: null,
    } as Awaited<ReturnType<typeof repository.create>>;

    vi.mocked(repository.create).mockResolvedValue(created);

    const result = await createContactSubmission({
      type: "shelter",
      name: "Jane Doe",
      email: "jane@example.com",
      message: "We would like to join Shelly.",
      shelterName: "Happy Paws",
      shelterLocation: "Córdoba",
      shelterType: "Nonprofit",
    });

    expect(sendContactSubmissionEmail).toHaveBeenCalledWith(created);
    expect(result).toEqual({ id: 1, success: true });
  });

  it("propagates delivery failures instead of reporting success", async () => {
    const created = {
      id: 2,
      type: "sponsor",
      name: "John Doe",
      email: "john@example.com",
      phone: null,
      organization: "Acme",
      message: "We would like to sponsor Shelly.",
      shelterName: null,
      shelterLocation: null,
      shelterType: null,
      createdAt: new Date().toISOString(),
      updatedAt: null,
      deletedAt: null,
    } as Awaited<ReturnType<typeof repository.create>>;

    vi.mocked(repository.create).mockResolvedValue(created);
    vi.mocked(sendContactSubmissionEmail).mockRejectedValue(
      new Error("SMTP unavailable"),
    );

    await expect(
      createContactSubmission({
        type: "sponsor",
        name: "John Doe",
        email: "john@example.com",
        organization: "Acme",
        message: "We would like to sponsor Shelly.",
      }),
    ).rejects.toThrow("SMTP unavailable");
  });
});

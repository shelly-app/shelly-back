import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { sendMemberInvitationEmail } from "@/api/shelters/members/email";
import * as repository from "@/api/shelters/members/repository";
import * as services from "@/api/shelters/members/services";

vi.mock("@/api/shelters/members/email", () => ({
  sendMemberInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/api/shelters/members/repository", () => ({
  findByShelterId: vi.fn().mockResolvedValue([]),
  findRoleByName: vi.fn().mockResolvedValue(null),
  findShelterById: vi.fn().mockResolvedValue({ id: 1, name: "Happy Paws" }),
  findUserByEmail: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(null),
  createMembership: vi.fn().mockResolvedValue(undefined),
  deleteMembership: vi.fn().mockResolvedValue(undefined),
  findMembership: vi.fn().mockResolvedValue(null),
}));

describe("shelters/members/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findShelterMembers", () => {
    it("should return mapped members with user info", async () => {
      const mockMembers = [
        {
          userId: 1,
          user: {
            name: "John Doe",
            email: "john@example.com",
            cognitoSub: "cognito-user-1",
          },
          role: { name: "admin" },
          joinedAt: new Date("2023-01-01"),
        },
        {
          userId: 2,
          user: {
            name: "Jane Smith",
            email: "jane@example.com",
            cognitoSub: "pending:jane@example.com",
          },
          role: { name: "member" },
          joinedAt: new Date("2023-02-01"),
        },
      ] as unknown as Awaited<ReturnType<typeof repository.findByShelterId>>;

      vi.mocked(repository.findByShelterId).mockResolvedValue(mockMembers);

      const result = await services.findShelterMembers(1);

      expect(result).toEqual([
        {
          userId: 1,
          name: "John Doe",
          email: "john@example.com",
          avatarUrl: null,
          role: "admin",
          pending: false,
          joinedAt: new Date("2023-01-01"),
        },
        {
          userId: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          avatarUrl: null,
          role: "member",
          pending: true,
          joinedAt: new Date("2023-02-01"),
        },
      ]);
    });

    it("should return empty array when no members", async () => {
      vi.mocked(repository.findByShelterId).mockResolvedValue([]);

      const result = await services.findShelterMembers(1);

      expect(result).toEqual([]);
    });
  });

  describe("registerMember", () => {
    it("should register new member with existing user", async () => {
      const mockRole = { id: 1, name: "admin" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      } as unknown as Awaited<ReturnType<typeof repository.findUserByEmail>>;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(repository.findMembership).mockResolvedValue(undefined);
      vi.mocked(repository.createMembership).mockResolvedValue(undefined);

      const result = await services.registerMember(
        1,
        "john@example.com",
        "admin",
      );

      expect(result).toEqual({
        data: {
          userId: 1,
          name: "John Doe",
          email: "john@example.com",
          role: "admin",
          shelterId: 1,
        },
      });
      expect(sendMemberInvitationEmail).toHaveBeenCalledWith({
        email: "john@example.com",
        shelterName: "Happy Paws",
        role: "admin",
      });
    });

    it("should create new user if not exists", async () => {
      const mockRole = { id: 1, name: "member" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findUserByEmail).mockResolvedValue(undefined);
      vi.mocked(repository.create).mockResolvedValue({
        id: 2,
        name: "newuser",
        email: "new@example.com",
      } as unknown as Awaited<ReturnType<typeof repository.create>>);
      vi.mocked(repository.findMembership).mockResolvedValue(undefined);
      vi.mocked(repository.createMembership).mockResolvedValue(undefined);

      const result = await services.registerMember(
        1,
        "new@example.com",
        "member",
      );

      expect(repository.create).toHaveBeenCalledWith({
        email: "new@example.com",
        name: "new",
        cognitoSub: "pending:new@example.com",
      });
      expect(result.data?.userId).toBe(2);
    });

    it("should throw ZodError for invalid role", async () => {
      vi.mocked(repository.findRoleByName).mockResolvedValue(undefined);

      await expect(
        services.registerMember(1, "john@example.com", "invalid_role"),
      ).rejects.toThrow(ZodError);
    });

    it("should return error when user already member", async () => {
      const mockRole = { id: 1, name: "admin" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      } as unknown as Awaited<ReturnType<typeof repository.findUserByEmail>>;
      const existingMembership = {
        userId: 1,
        shelterId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.findMembership>>;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(repository.findMembership).mockResolvedValue(
        existingMembership,
      );

      const result = await services.registerMember(
        1,
        "john@example.com",
        "admin",
      );

      expect(result).toEqual({
        error: "User is already a member of this shelter",
        status: 400,
      });
    });

    it("should return error when user creation fails", async () => {
      const mockRole = { id: 1, name: "member" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findUserByEmail).mockResolvedValue(undefined);
      vi.mocked(repository.create).mockResolvedValue(undefined);

      const result = await services.registerMember(
        1,
        "new@example.com",
        "member",
      );

      expect(result).toEqual({
        error: "Failed to create user",
        status: 500,
      });
    });

    it("should roll back membership when invitation delivery fails", async () => {
      const mockRole = { id: 1, name: "volunteer" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      } as unknown as Awaited<ReturnType<typeof repository.findUserByEmail>>;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findUserByEmail).mockResolvedValue(mockUser);
      vi.mocked(repository.findMembership).mockResolvedValue(undefined);
      vi.mocked(sendMemberInvitationEmail).mockRejectedValue(
        new Error("SMTP unavailable"),
      );

      await expect(
        services.registerMember(1, "john@example.com", "volunteer"),
      ).rejects.toThrow("SMTP unavailable");

      expect(repository.deleteMembership).toHaveBeenCalledWith(1, 1);
    });
  });

  describe("removeMember", () => {
    it("should remove an existing member without sending email", async () => {
      vi.mocked(repository.findMembership).mockResolvedValue({
        userId: 2,
        shelterId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.findMembership>>);

      const result = await services.removeMember(1, 2);

      expect(repository.deleteMembership).toHaveBeenCalledWith(2, 1);
      expect(sendMemberInvitationEmail).not.toHaveBeenCalled();
      expect(result).toEqual({ data: true });
    });

    it("should return not found for a non-member", async () => {
      vi.mocked(repository.findMembership).mockResolvedValue(undefined);

      const result = await services.removeMember(1, 999);

      expect(repository.deleteMembership).not.toHaveBeenCalled();
      expect(result).toEqual({ error: "Member not found", status: 404 });
    });
  });
});

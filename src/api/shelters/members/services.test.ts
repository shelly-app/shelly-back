import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import * as repository from "@/api/shelters/members/repository";
import * as services from "@/api/shelters/members/services";

vi.mock("@/api/shelters/members/repository", () => ({
  findByShelterId: vi.fn().mockResolvedValue([]),
  findRoleByName: vi.fn().mockResolvedValue(null),
  findUserByEmail: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue(null),
  createMembership: vi.fn().mockResolvedValue(undefined),
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
          user: { name: "John Doe", email: "john@example.com" },
          role: { name: "admin" },
          joinedAt: new Date("2023-01-01"),
        },
        {
          userId: 2,
          user: { name: "Jane Smith", email: "jane@example.com" },
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
          role: "admin",
          joinedAt: new Date("2023-01-01"),
        },
        {
          userId: 2,
          name: "Jane Smith",
          email: "jane@example.com",
          role: "member",
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
  });
});

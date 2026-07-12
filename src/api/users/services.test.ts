import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { hasPermission } from "@/api/middleware/require-permission";
import * as repository from "@/api/users/repository";
import * as services from "@/api/users/services";

vi.mock("@/api/users/repository", () => ({
  findShelterIdsByUserId: vi.fn().mockResolvedValue([]),
  findMembershipsByUserAndShelterIds: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(undefined),
  updateName: vi.fn().mockResolvedValue(undefined),
  findRoleByName: vi.fn().mockResolvedValue(undefined),
  findShelterMember: vi.fn().mockResolvedValue(undefined),
  updateShelterRole: vi.fn().mockResolvedValue(undefined),
  findShelterMemberships: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/api/middleware/require-permission", () => ({
  hasPermission: vi.fn().mockResolvedValue(false),
}));

describe("users/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findUserWithSharedShelters", () => {
    it("should return user with shared shelters", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([1, 2]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([
        {
          shelterId: 1,
          shelter: { name: "Happy Paws" },
          role: { name: "admin" },
        },
      ] as unknown as Awaited<
        ReturnType<typeof repository.findMembershipsByUserAndShelterIds>
      >);
      vi.mocked(repository.findById).mockResolvedValue({
        id: 2,
        name: "Jane Doe",
        email: "jane@example.com",
      } as unknown as Awaited<ReturnType<typeof repository.findById>>);

      const result = await services.findUserWithSharedShelters(1, 2);

      expect(result).toEqual({
        id: 2,
        name: "Jane Doe",
        email: "jane@example.com",
        avatarUrl: null,
        shelters: [{ id: 1, name: "Happy Paws", role: "admin" }],
      });
    });

    it("should return null when current user has no shelters", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([]);

      const result = await services.findUserWithSharedShelters(1, 2);

      expect(result).toBeNull();
    });

    it("should return null when target user has no shared memberships", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([1]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([]);

      const result = await services.findUserWithSharedShelters(1, 2);

      expect(result).toBeNull();
    });

    it("should return null when target user not found", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([1]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([
        {
          shelterId: 1,
          shelter: { name: "Happy Paws" },
          role: { name: "admin" },
        },
      ] as unknown as Awaited<
        ReturnType<typeof repository.findMembershipsByUserAndShelterIds>
      >);
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.findUserWithSharedShelters(1, 2);

      expect(result).toBeNull();
    });
  });

  describe("updateUserName", () => {
    it("should update user name", async () => {
      vi.mocked(repository.updateName).mockResolvedValue(undefined);

      await services.updateUserName(1, "New Name");

      expect(repository.updateName).toHaveBeenCalledWith(1, "New Name");
    });
  });

  describe("canEditUser", () => {
    it("should return true when user has permission", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([1]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([
        {
          shelterId: 1,
          shelter: { name: "Happy Paws" },
          role: { name: "admin" },
        },
      ] as unknown as Awaited<
        ReturnType<typeof repository.findMembershipsByUserAndShelterIds>
      >);
      vi.mocked(hasPermission).mockResolvedValue(true);

      const result = await services.canEditUser(1, 2);

      expect(result).toBe(true);
    });

    it("should return true when user has permission in at least one of multiple shared shelters", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([1, 2]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([
        {
          shelterId: 1,
          shelter: { name: "Happy Paws" },
          role: { name: "member" },
        },
        {
          shelterId: 2,
          shelter: { name: "Cat Haven" },
          role: { name: "admin" },
        },
      ] as unknown as Awaited<
        ReturnType<typeof repository.findMembershipsByUserAndShelterIds>
      >);

      // Mock hasPermission to return false for shelter 1 and true for shelter 2
      vi.mocked(hasPermission).mockImplementation(async (_, shelterId) => {
        return shelterId === 2;
      });

      const result = await services.canEditUser(1, 2);

      expect(result).toBe(true);
      expect(hasPermission).toHaveBeenCalledTimes(2);
    });

    it("should return false when user has no memberships", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([]);

      const result = await services.canEditUser(1, 2);

      expect(result).toBe(false);
    });

    it("should return false when user has no permission", async () => {
      vi.mocked(repository.findShelterIdsByUserId).mockResolvedValue([1]);
      vi.mocked(
        repository.findMembershipsByUserAndShelterIds,
      ).mockResolvedValue([
        {
          shelterId: 1,
          shelter: { name: "Happy Paws" },
          role: { name: "member" },
        },
      ] as unknown as Awaited<
        ReturnType<typeof repository.findMembershipsByUserAndShelterIds>
      >);
      vi.mocked(hasPermission).mockResolvedValue(false);

      const result = await services.canEditUser(1, 2);

      expect(result).toBe(false);
    });
  });

  describe("updateUserShelterRole", () => {
    it("should update user role successfully", async () => {
      const mockRole = { id: 1, name: "admin" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findShelterMember).mockResolvedValue({
        roleId: 1,
        shelterId: 1,
        userId: 1,
        joinedAt: new Date(),
      } as unknown as Awaited<ReturnType<typeof repository.findShelterMember>>);
      vi.mocked(repository.updateShelterRole).mockResolvedValue(undefined);

      const result = await services.updateUserShelterRole(1, 1, "admin");

      expect(result).toBe(true);
    });

    it("should throw ZodError for invalid role", async () => {
      vi.mocked(repository.findRoleByName).mockResolvedValue(undefined);

      await expect(
        services.updateUserShelterRole(1, 1, "invalid_role"),
      ).rejects.toThrow(z.ZodError);
    });

    it("should return null when membership not found", async () => {
      const mockRole = { id: 1, name: "admin" } as unknown as Awaited<
        ReturnType<typeof repository.findRoleByName>
      >;

      vi.mocked(repository.findRoleByName).mockResolvedValue(mockRole);
      vi.mocked(repository.findShelterMember).mockResolvedValue(undefined);

      const result = await services.updateUserShelterRole(1, 1, "admin");

      expect(result).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("should return user by id", async () => {
      const mockUser = {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;

      vi.mocked(repository.findById).mockResolvedValue(mockUser);

      const result = await services.findUserById(1);

      expect(result).toEqual(mockUser);
    });
  });

  describe("getAuthenticatedUser", () => {
    it("should return user with shelter memberships", async () => {
      vi.mocked(repository.findShelterMemberships).mockResolvedValue({
        name: "John Doe",
        email: "john@example.com",
        shelterMemberships: [
          {
            shelterId: 1,
            shelter: { name: "Happy Paws" },
            role: { name: "admin" },
          },
        ],
      } as unknown as Awaited<
        ReturnType<typeof repository.findShelterMemberships>
      >);

      const result = await services.getAuthenticatedUser(1);

      expect(result).toEqual({
        name: "John Doe",
        email: "john@example.com",
        avatarUrl: null,
        shelters: [{ id: 1, name: "Happy Paws", role: "admin" }],
      });
    });

    it("should return null when user not found", async () => {
      vi.mocked(repository.findShelterMemberships).mockResolvedValue(undefined);

      const result = await services.getAuthenticatedUser(1);

      expect(result).toBeNull();
    });
  });
});

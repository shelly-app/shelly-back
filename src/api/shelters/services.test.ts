import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "@/api/shelters/repository";
import * as services from "@/api/shelters/services";

vi.mock("@/api/shelters/repository", () => ({
  findAll: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(undefined),
  findPets: vi.fn().mockResolvedValue([]),
}));

describe("shelters/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAllShelters", () => {
    it("should return all shelters", async () => {
      const mockShelters = [
        { id: 1, name: "Happy Paws", city: "Austin", state: "TX" },
        { id: 2, name: "Cat Haven", city: "Dallas", state: "TX" },
      ] as unknown as Awaited<ReturnType<typeof repository.findAll>>;

      vi.mocked(repository.findAll).mockResolvedValue(mockShelters);

      const result = await services.findAllShelters();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockShelters);
    });

    it("should return empty array when no shelters", async () => {
      vi.mocked(repository.findAll).mockResolvedValue([]);

      const result = await services.findAllShelters();

      expect(result).toEqual([]);
    });
  });

  describe("findShelterById", () => {
    it("should return shelter by id", async () => {
      const mockShelter = {
        id: 1,
        name: "Happy Paws",
        city: "Austin",
        state: "TX",
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;

      vi.mocked(repository.findById).mockResolvedValue(mockShelter);

      const result = await services.findShelterById(1);

      expect(result).toEqual(mockShelter);
    });

    it("should return null when shelter not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(null);

      const result = await services.findShelterById(999);

      expect(result).toBeNull();
    });
  });

  describe("findShelterPets", () => {
    it("should return mapped pets with vaccinations and events", async () => {
      const mockPets = [
        {
          id: 1,
          name: "Buddy",
          birthDate: "2022-01-15",
          breed: "Golden Retriever",
          specie: "dog",
          sex: "male",
          size: "large",
          status: "in_shelter",
          description: "Friendly dog",
          colors: ["golden"],
          shelter: { name: "Happy Paws", city: "Austin" },
          vaccinations: [
            {
              vaccine: { name: "DHPP" },
              administeredAt: new Date("2023-01-01"),
            },
          ],
          events: [
            {
              id: 1,
              name: "Status change",
              description: "Status changed from pending to in_shelter",
              createdAt: new Date("2023-01-02"),
            },
          ],
        },
      ] as unknown as Awaited<ReturnType<typeof repository.findPets>>;

      vi.mocked(repository.findPets).mockResolvedValue(mockPets);

      const result = await services.findShelterPets(1);

      expect(repository.findPets).toHaveBeenCalledWith(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 1,
        name: "Buddy",
        birthDate: "2022-01-15",
        breed: "Golden Retriever",
        specie: "dog",
        sex: "male",
        size: "large",
        status: "in_shelter",
        description: "Friendly dog",
        colors: ["golden"],
        shelter: { name: "Happy Paws", city: "Austin" },
        vaccinations: [
          {
            vaccine: "DHPP",
            administeredAt: "2023-01-01T00:00:00.000Z",
          },
        ],
        events: [
          {
            id: 1,
            name: "Status change",
            description: "Status changed from pending to in_shelter",
            createdAt: "2023-01-02T00:00:00.000Z",
          },
        ],
      });
    });

    it("should handle pets with no vaccinations or events", async () => {
      const mockPets = [
        {
          id: 1,
          name: "Buddy",
          birthDate: "2022-01-15",
          breed: "Golden Retriever",
          specie: "dog",
          sex: "male",
          size: "large",
          status: "in_shelter",
          description: "Friendly dog",
          colors: ["golden"],
          shelter: { name: "Happy Paws", city: "Austin" },
          vaccinations: [],
          events: [],
        },
      ] as unknown as Awaited<ReturnType<typeof repository.findPets>>;

      vi.mocked(repository.findPets).mockResolvedValue(mockPets);

      const result = await services.findShelterPets(1);

      expect(result[0]?.vaccinations).toEqual([]);
      expect(result[0]?.events).toEqual([]);
    });

    it("should return empty array when no pets", async () => {
      vi.mocked(repository.findPets).mockResolvedValue([]);

      const result = await services.findShelterPets(1);

      expect(result).toEqual([]);
    });
  });
});

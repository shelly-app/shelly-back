import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "@/api/pets/repository";
import * as services from "@/api/pets/services";

vi.mock("@/api/pets/repository", () => ({
  findAllPublic: vi.fn().mockResolvedValue([]),
  findByIdPublic: vi.fn().mockResolvedValue(null),
  findAllColors: vi.fn().mockResolvedValue([]),
  findAllSpecies: vi.fn().mockResolvedValue([]),
  findAllStatuses: vi.fn().mockResolvedValue([]),
  findAllVaccines: vi.fn().mockResolvedValue([]),
}));

describe("pets/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findAllPublicPets", () => {
    it("should return mapped pets with shelter info", async () => {
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
        },
        {
          id: 2,
          name: "Whiskers",
          birthDate: "2021-06-20",
          breed: "Persian",
          specie: "cat",
          sex: "female",
          size: "small",
          status: "adopted",
          description: "Calm cat",
          colors: ["white"],
          shelter: { name: "Cat Haven", city: "Dallas" },
        },
      ] as unknown as Awaited<ReturnType<typeof repository.findAllPublic>>;

      vi.mocked(repository.findAllPublic).mockResolvedValue(mockPets);

      const result = await services.findAllPublicPets();

      expect(repository.findAllPublic).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
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
        photoUrl: null,
        shelter: { name: "Happy Paws", city: "Austin" },
      });
    });

    it("should handle empty result", async () => {
      vi.mocked(repository.findAllPublic).mockResolvedValue([]);

      const result = await services.findAllPublicPets();

      expect(result).toEqual([]);
    });

    it("should handle null colors", async () => {
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
          colors: null,
          shelter: { name: "Happy Paws", city: "Austin" },
        },
      ] as unknown as Awaited<ReturnType<typeof repository.findAllPublic>>;

      vi.mocked(repository.findAllPublic).mockResolvedValue(mockPets);

      const result = await services.findAllPublicPets();

      expect(result[0]?.colors).toEqual([]);
    });
  });

  describe("findPublicPetById", () => {
    it("should return pet when found", async () => {
      const mockPet = {
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
      } as unknown as Awaited<ReturnType<typeof repository.findByIdPublic>>;

      vi.mocked(repository.findByIdPublic).mockResolvedValue(mockPet);

      const result = await services.findPublicPetById(1);

      expect(result).toEqual({
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
        photoUrl: null,
        shelter: { name: "Happy Paws", city: "Austin" },
      });
    });

    it("should return null when pet not found", async () => {
      vi.mocked(repository.findByIdPublic).mockResolvedValue(undefined);

      const result = await services.findPublicPetById(999);

      expect(result).toBeNull();
    });
  });

  describe("findAllColors", () => {
    it("should return array of colors", async () => {
      vi.mocked(repository.findAllColors).mockResolvedValue([
        { color: "black" },
        { color: "white" },
        { color: "brown" },
      ]);

      const result = await services.findAllColors();

      expect(result).toEqual(["black", "white", "brown"]);
    });
  });

  describe("findAllSpecies", () => {
    it("should return array of species", async () => {
      vi.mocked(repository.findAllSpecies).mockResolvedValue([
        { specie: "dog" },
        { specie: "cat" },
      ]);

      const result = await services.findAllSpecies();

      expect(result).toEqual(["dog", "cat"]);
    });
  });

  describe("findAllStatuses", () => {
    it("should return array of statuses", async () => {
      vi.mocked(repository.findAllStatuses).mockResolvedValue([
        { status: "in_shelter" },
        { status: "adopted" },
        { status: "in_foster" },
      ]);

      const result = await services.findAllStatuses();

      expect(result).toEqual(["in_shelter", "adopted", "in_foster"]);
    });
  });

  describe("findAllVaccines", () => {
    it("should return mapped vaccines", async () => {
      vi.mocked(repository.findAllVaccines).mockResolvedValue([
        {
          id: 1,
          code: "DHPP",
          name: "Distemper, Hepatitis, Parvo, Parainfluenza",
          specie: "dog",
        },
        { id: 2, code: "RABIES", name: "Rabies", specie: "dog" },
      ]);

      const result = await services.findAllVaccines();

      expect(result).toEqual([
        {
          code: "DHPP",
          name: "Distemper, Hepatitis, Parvo, Parainfluenza",
          specie: "dog",
        },
        { code: "RABIES", name: "Rabies", specie: "dog" },
      ]);
    });
  });
});

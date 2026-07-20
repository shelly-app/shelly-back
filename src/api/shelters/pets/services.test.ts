import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import * as repository from "@/api/shelters/pets/repository";
import * as services from "@/api/shelters/pets/services";

vi.mock("@/api/shelters/pets/repository", () => ({
  findById: vi.fn().mockResolvedValue(undefined),
  findShelterById: vi.fn().mockResolvedValue(undefined),
  findVaccineByCode: vi.fn().mockResolvedValue(undefined),
  createPet: vi.fn().mockResolvedValue({}),
  updatePet: vi.fn().mockResolvedValue(undefined),
  deletePetById: vi.fn().mockResolvedValue(undefined),
  createVaccinationRecord: vi
    .fn()
    .mockResolvedValue({ id: 1, administeredAt: new Date() }),
  createEventRecord: vi.fn().mockResolvedValue({ id: 1 }),
  deleteEventRecord: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/db", () => ({
  db: {
    transaction: vi.fn().mockImplementation((callback) => callback()),
  },
}));

describe("shelters/pets/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockShelter = {
    id: 1,
    name: "Happy Paws",
    createdAt: "2023-01-01",
    updatedAt: null,
    deletedAt: null,
    address: "123 Main St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    country: "USA",
  } as unknown as Awaited<ReturnType<typeof repository.findShelterById>>;

  const baseMockPet = {
    id: 1,
    name: "Buddy",
    createdAt: "2023-01-01",
    updatedAt: "2023-01-01",
    deletedAt: null,
    birthDate: "2022-01-15",
    breed: "Golden Retriever",
    specie: "dog",
    sex: "male",
    size: "large",
    status: "in_shelter",
    description: "Friendly dog",
    colors: ["golden"],
    shelterId: 1,
  };

  describe("findShelterPetDetailed", () => {
    it("should return pet with vaccinations and events", async () => {
      const mockPet = {
        ...baseMockPet,
        shelter: { name: "Happy Paws", city: "Austin" },
        vaccinations: [
          { vaccine: { name: "DHPP" }, administeredAt: new Date("2023-01-01") },
        ],
        events: [
          {
            id: 1,
            name: "Status change",
            description: "Status changed to in_shelter",
            createdAt: new Date("2023-01-02"),
            updatedAt: null,
            deletedAt: null,
            type: "status_change",
            userId: 1,
            petId: 1,
          },
        ],
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;

      vi.mocked(repository.findById).mockResolvedValue(mockPet);

      const result = await services.findShelterPetDetailed(1, 1);

      expect(result?.name).toBe("Buddy");
      expect(result?.vaccinations).toHaveLength(1);
      expect(result?.events).toHaveLength(1);
    });

    it("should return null when pet not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.findShelterPetDetailed(1, 999);

      expect(result).toBeNull();
    });
  });

  describe("registerPet", () => {
    const validBody = {
      name: "Buddy",
      sex: "male" as const,
      size: "large" as const,
      status: "in_shelter",
      specie: "dog",
      breed: "Golden Retriever",
      colors: ["golden"],
    };

    it("should create pet successfully", async () => {
      vi.mocked(repository.findShelterById).mockResolvedValue(mockShelter);
      vi.mocked(repository.createPet).mockResolvedValue({
        ...baseMockPet,
        createdAt: "2023-01-01",
        updatedAt: "2023-01-01",
      } as unknown as Awaited<ReturnType<typeof repository.createPet>>);

      const result = await services.registerPet(1, validBody);

      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe("Buddy");
    });

    it("should return error when shelter not found", async () => {
      vi.mocked(repository.findShelterById).mockResolvedValue(undefined);

      const result = await services.registerPet(999, validBody);

      expect(result).toEqual({ error: "Shelter not found" });
    });

    it("should throw ZodError for invalid specie", async () => {
      vi.mocked(repository.findShelterById).mockResolvedValue(mockShelter);

      await expect(
        services.registerPet(1, { ...validBody, specie: "invalid" }),
      ).rejects.toThrow(ZodError);
    });

    it("should throw ZodError for invalid status", async () => {
      vi.mocked(repository.findShelterById).mockResolvedValue(mockShelter);

      await expect(
        services.registerPet(1, { ...validBody, status: "invalid" }),
      ).rejects.toThrow(ZodError);
    });

    it("should throw ZodError for invalid colors", async () => {
      vi.mocked(repository.findShelterById).mockResolvedValue(mockShelter);

      await expect(
        services.registerPet(1, { ...validBody, colors: ["invalid_color"] }),
      ).rejects.toThrow(ZodError);
    });

    it("should allow empty colors array", async () => {
      vi.mocked(repository.findShelterById).mockResolvedValue(mockShelter);
      vi.mocked(repository.createPet).mockResolvedValue({
        ...baseMockPet,
        colors: null,
        createdAt: "2023-01-01",
        updatedAt: "2023-01-01",
      } as unknown as Awaited<ReturnType<typeof repository.createPet>>);

      const result = await services.registerPet(1, {
        ...validBody,
        colors: [],
      });

      expect(result.data).toBeDefined();
    });
  });

  describe("updatePet", () => {
    const existingPet = {
      ...baseMockPet,
      shelter: { name: "Happy Paws", city: "Austin" },
      vaccinations: [],
      events: [],
      updatedAt: "2023-01-01",
      deletedAt: null,
    } as unknown as Awaited<ReturnType<typeof repository.findById>>;

    it("should update pet name successfully", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);
      vi.mocked(repository.updatePet).mockResolvedValue({
        ...existingPet,
        name: "Max",
      } as unknown as Awaited<ReturnType<typeof repository.updatePet>>);

      const result = await services.updatePet(1, 1, 1, { name: "Max" });

      expect(result.data?.name).toBe("Max");
    });

    it("should return error when pet not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.updatePet(1, 999, 1, { name: "Max" });

      expect(result).toEqual({ error: "Pet not found" });
    });

    it("should throw ZodError for invalid status", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);

      await expect(
        services.updatePet(1, 1, 1, { status: "invalid" }),
      ).rejects.toThrow(ZodError);
    });

    it("should throw ZodError for invalid specie", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);

      await expect(
        services.updatePet(1, 1, 1, { specie: "invalid" }),
      ).rejects.toThrow(ZodError);
    });

    it("should throw ZodError for invalid colors", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);

      await expect(
        services.updatePet(1, 1, 1, { colors: ["invalid"] }),
      ).rejects.toThrow(ZodError);
    });

    it("should create event when status changes", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);
      vi.mocked(repository.updatePet).mockResolvedValue({
        ...existingPet,
        status: "adopted",
      } as unknown as Awaited<ReturnType<typeof repository.updatePet>>);
      vi.mocked(repository.createEventRecord).mockResolvedValue({
        id: 1,
        name: "Status change",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        type: "status_change",
        description: "Status changed from in_shelter to adopted",
        userId: 1,
        petId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.createEventRecord>>);

      await services.updatePet(1, 1, 1, { status: "adopted" });

      expect(repository.createEventRecord).toHaveBeenCalledWith({
        petId: 1,
        userId: 1,
        type: "status_change",
        name: "Status change",
        metadata: { from: "in_shelter", to: "adopted" },
      });
    });

    it("should create event when name changes", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);
      vi.mocked(repository.updatePet).mockResolvedValue({
        ...existingPet,
        name: "Max",
      } as unknown as Awaited<ReturnType<typeof repository.updatePet>>);
      vi.mocked(repository.createEventRecord).mockResolvedValue({
        id: 1,
        name: "Name change",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        type: "name_change",
        description: 'Name changed from "Buddy" to "Max"',
        userId: 1,
        petId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.createEventRecord>>);

      await services.updatePet(1, 1, 1, { name: "Max" });

      expect(repository.createEventRecord).toHaveBeenCalledWith({
        petId: 1,
        userId: 1,
        type: "name_change",
        name: "Name change",
        metadata: { from: "Buddy", to: "Max" },
      });
    });

    it("should create event when size changes", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);
      vi.mocked(repository.updatePet).mockResolvedValue({
        ...existingPet,
        size: "medium",
      } as unknown as Awaited<ReturnType<typeof repository.updatePet>>);
      vi.mocked(repository.createEventRecord).mockResolvedValue({
        id: 1,
        name: "Size change",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        type: "size_change",
        description: "Size changed from large to medium",
        userId: 1,
        petId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.createEventRecord>>);

      await services.updatePet(1, 1, 1, { size: "medium" });

      expect(repository.createEventRecord).toHaveBeenCalledWith({
        petId: 1,
        userId: 1,
        type: "size_change",
        name: "Size change",
        metadata: { from: "large", to: "medium" },
      });
    });

    it("should not create event when same values", async () => {
      vi.mocked(repository.findById).mockResolvedValue(existingPet);
      vi.mocked(repository.updatePet).mockResolvedValue(
        existingPet as unknown as Awaited<
          ReturnType<typeof repository.updatePet>
        >,
      );

      await services.updatePet(1, 1, 1, { name: "Buddy" });

      expect(repository.createEventRecord).not.toHaveBeenCalled();
    });
  });

  describe("deletePet", () => {
    it("should delete pet successfully", async () => {
      const mockPet = {
        ...baseMockPet,
        shelter: { name: "Happy Paws", city: "Austin" },
        vaccinations: [],
        events: [],
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;

      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.deletePetById).mockResolvedValue(undefined);

      const result = await services.deletePet(1, 1);

      expect(result).toBe(true);
    });

    it("should return false when pet not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.deletePet(1, 999);

      expect(result).toBe(false);
    });
  });

  describe("registerVaccination", () => {
    const mockPet = {
      ...baseMockPet,
      shelter: { name: "Happy Paws", city: "Austin" },
      vaccinations: [],
      events: [],
    } as unknown as Awaited<ReturnType<typeof repository.findById>>;

    it("should register vaccination successfully", async () => {
      const mockVaccine = {
        id: 1,
        code: "DHPP",
        name: "Distemper",
      } as unknown as Awaited<ReturnType<typeof repository.findVaccineByCode>>;
      const mockVaccination = {
        id: 1,
        petId: 1,
        vaccineId: 1,
        administeredAt: new Date("2023-01-01"),
      };

      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.findVaccineByCode).mockResolvedValue(mockVaccine);
      vi.mocked(repository.createVaccinationRecord).mockResolvedValue(
        mockVaccination as unknown as Awaited<
          ReturnType<typeof repository.createVaccinationRecord>
        >,
      );
      vi.mocked(repository.createEventRecord).mockResolvedValue({
        id: 1,
        name: "Vaccination",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        type: "vaccination",
        description: "Vaccination: Distemper (DHPP)",
        userId: 1,
        petId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.createEventRecord>>);

      const result = await services.registerVaccination(1, 1, 1, "DHPP");

      expect(result.data?.vaccineName).toBe("Distemper");
      expect(result.data?.vaccineCode).toBe("DHPP");
    });

    it("should return error when pet not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.registerVaccination(1, 999, 1, "DHPP");

      expect(result).toEqual({ error: "Pet not found" });
    });

    it("should return error when vaccine not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.findVaccineByCode).mockResolvedValue(undefined);

      const result = await services.registerVaccination(1, 1, 1, "INVALID");

      expect(result).toEqual({ error: "Vaccine not found" });
    });

    it("should throw when vaccination creation fails", async () => {
      const mockVaccine = {
        id: 1,
        code: "DHPP",
        name: "Distemper",
      } as unknown as Awaited<ReturnType<typeof repository.findVaccineByCode>>;

      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.findVaccineByCode).mockResolvedValue(mockVaccine);
      vi.mocked(repository.createVaccinationRecord).mockResolvedValue(
        null as unknown as Awaited<
          ReturnType<typeof repository.createVaccinationRecord>
        >,
      );

      await expect(
        services.registerVaccination(1, 1, 1, "DHPP"),
      ).rejects.toThrow("Failed to register vaccination");
    });
  });

  describe("registerEvent", () => {
    it("should register event successfully", async () => {
      const mockPet = {
        ...baseMockPet,
        shelter: { name: "Happy Paws", city: "Austin" },
        vaccinations: [],
        events: [],
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;
      const mockEvent = {
        id: 1,
        name: "Vet visit",
        description: "Annual checkup",
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        type: "user_event",
        userId: 1,
        petId: 1,
      } as unknown as Awaited<ReturnType<typeof repository.createEventRecord>>;

      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.createEventRecord).mockResolvedValue(mockEvent);
      const scheduledFor = new Date("2026-07-21T15:30:00.000Z");

      const result = await services.registerEvent(
        1,
        1,
        1,
        "Vet visit",
        "Annual checkup",
        scheduledFor,
        true,
      );

      expect(result.data?.name).toBe("Vet visit");
      expect(repository.createEventRecord).toHaveBeenCalledWith({
        petId: 1,
        userId: 1,
        type: "user_event",
        name: "Vet visit",
        description: "Annual checkup",
        scheduledFor,
        metadata: { hasTime: true },
      });
    });

    it("should return error when pet not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.registerEvent(1, 999, 1, "Vet visit");

      expect(result).toEqual({ error: "Pet not found in shelter" });
    });

    it("should throw when event creation fails", async () => {
      const mockPet = {
        ...baseMockPet,
        shelter: { name: "Happy Paws", city: "Austin" },
        vaccinations: [],
        events: [],
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;

      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.createEventRecord).mockResolvedValue(
        null as unknown as Awaited<
          ReturnType<typeof repository.createEventRecord>
        >,
      );

      await expect(
        services.registerEvent(1, 1, 1, "Vet visit"),
      ).rejects.toThrow("Failed to register event");
    });
  });

  describe("deleteEvent", () => {
    it("should delete event successfully", async () => {
      const mockPet = {
        ...baseMockPet,
        shelter: { name: "Happy Paws", city: "Austin" },
        vaccinations: [],
        events: [],
      } as unknown as Awaited<ReturnType<typeof repository.findById>>;

      vi.mocked(repository.findById).mockResolvedValue(mockPet);
      vi.mocked(repository.deleteEventRecord).mockResolvedValue(undefined);

      const result = await services.deleteEvent(1, 1, 1);

      expect(result).toEqual({ data: true });
    });

    it("should return error when pet not found", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.deleteEvent(1, 999, 1);

      expect(result).toEqual({ error: "Pet not found in shelter" });
    });
  });
});

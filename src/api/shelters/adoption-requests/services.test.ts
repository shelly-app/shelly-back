import { beforeEach, describe, expect, it, vi } from "vitest";
import * as repository from "@/api/shelters/adoption-requests/repository";
import * as services from "@/api/shelters/adoption-requests/services";

vi.mock("@/api/shelters/adoption-requests/repository", () => ({
  findByShelterId: vi.fn().mockResolvedValue([]),
  findById: vi.fn().mockResolvedValue(undefined),
  findPetInShelter: vi.fn().mockResolvedValue(undefined),
  create: vi.fn().mockResolvedValue(undefined),
  updateStatus: vi.fn().mockResolvedValue(undefined),
}));

type Row = Awaited<ReturnType<typeof repository.findById>>;

const baseRow = {
  id: 1,
  petId: 10,
  shelterId: 5,
  requesterName: "Juan Pérez",
  requesterEmail: "juan@example.com",
  requesterPhone: "+5491112345678",
  status: "pending",
  message: "Quiero adoptar",
  rejectionReason: null,
  location: "CABA",
  familyComposition: "Soltero",
  hasYard: false,
  approvedAt: null,
  rejectedAt: null,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
  pet: { id: 10, name: "Luna" },
};

describe("shelters/adoption-requests/services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listShelterAdoptionRequests", () => {
    it("maps rows to the response shape", async () => {
      vi.mocked(repository.findByShelterId).mockResolvedValue([
        baseRow,
      ] as unknown as Awaited<ReturnType<typeof repository.findByShelterId>>);

      const result = await services.listShelterAdoptionRequests(5);

      expect(result).toEqual([
        {
          id: 1,
          petId: 10,
          petName: "Luna",
          requesterName: "Juan Pérez",
          requesterEmail: "juan@example.com",
          requesterPhone: "+5491112345678",
          status: "pending",
          message: "Quiero adoptar",
          rejectionReason: null,
          approvedAt: null,
          rejectedAt: null,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: null,
          questionnaire: {
            location: "CABA",
            familyComposition: "Soltero",
            hasYard: false,
          },
        },
      ]);
    });

    it("forwards the status filter to the repository", async () => {
      await services.listShelterAdoptionRequests(5, "approved");
      expect(repository.findByShelterId).toHaveBeenCalledWith(5, "approved");
    });
  });

  describe("createAdoptionRequest", () => {
    it("returns 404 when the pet is not in the shelter", async () => {
      vi.mocked(repository.findPetInShelter).mockResolvedValue(undefined);

      const result = await services.createAdoptionRequest(5, 10, {
        requesterName: "Juan",
        requesterEmail: "juan@example.com",
        location: "CABA",
      });

      expect(result).toEqual({
        error: "Pet not found in shelter",
        status: 404,
      });
    });

    it("creates the request and returns the mapped response", async () => {
      vi.mocked(repository.findPetInShelter).mockResolvedValue({
        id: 10,
        name: "Luna",
      } as unknown as Awaited<ReturnType<typeof repository.findPetInShelter>>);
      vi.mocked(repository.create).mockResolvedValue({
        ...baseRow,
      } as unknown as Awaited<ReturnType<typeof repository.create>>);

      const result = await services.createAdoptionRequest(5, 10, {
        requesterName: "Juan Pérez",
        requesterEmail: "juan@example.com",
        requesterPhone: "+5491112345678",
        message: "Quiero adoptar",
        location: "CABA",
        familyComposition: "Soltero",
        hasYard: false,
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ petId: 10, shelterId: 5 }),
      );
      expect(result.data?.petName).toBe("Luna");
    });
  });

  describe("updateAdoptionRequestStatus", () => {
    it("returns 404 when the request does not exist", async () => {
      vi.mocked(repository.findById).mockResolvedValue(undefined);

      const result = await services.updateAdoptionRequestStatus(
        5,
        1,
        "approved",
      );

      expect(result).toEqual({
        error: "Adoption request not found",
        status: 404,
      });
    });

    it("sets approvedAt and clears rejection fields on approve", async () => {
      vi.mocked(repository.findById).mockResolvedValue(
        baseRow as unknown as Row,
      );
      vi.mocked(repository.updateStatus).mockImplementation(
        async (_id, data) =>
          ({
            ...baseRow,
            ...data,
          }) as unknown as Awaited<ReturnType<typeof repository.updateStatus>>,
      );

      const result = await services.updateAdoptionRequestStatus(
        5,
        1,
        "approved",
      );

      const call = vi.mocked(repository.updateStatus).mock.calls[0]?.[1];
      expect(call?.status).toBe("approved");
      expect(call?.approvedAt).toBeTruthy();
      expect(call?.rejectedAt).toBeNull();
      expect(result.data?.status).toBe("approved");
    });

    it("stores the rejection reason on reject", async () => {
      vi.mocked(repository.findById).mockResolvedValue(
        baseRow as unknown as Row,
      );
      vi.mocked(repository.updateStatus).mockImplementation(
        async (_id, data) =>
          ({
            ...baseRow,
            ...data,
          }) as unknown as Awaited<ReturnType<typeof repository.updateStatus>>,
      );

      await services.updateAdoptionRequestStatus(
        5,
        1,
        "rejected",
        "No pudimos contactar al solicitante",
      );

      const call = vi.mocked(repository.updateStatus).mock.calls[0]?.[1];
      expect(call?.status).toBe("rejected");
      expect(call?.rejectionReason).toBe("No pudimos contactar al solicitante");
      expect(call?.rejectedAt).toBeTruthy();
      expect(call?.approvedAt).toBeNull();
    });
  });
});

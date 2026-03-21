import type { Request, Response } from "express";
import { StatusCodes } from "#/api/constants.js";
import {
  petEventParamsSchema,
  registerEventBodySchema,
  registerPetBodySchema,
  registerVaccinationBodySchema,
  shelterIdParamsSchema,
  shelterPetParamsSchema,
  updatePetBodySchema,
} from "#/api/shelters/pets/schemas.js";
import {
  deleteEvent,
  deletePet,
  findShelterPetDetailed,
  registerEvent,
  registerPet,
  registerVaccination,
  updatePet,
} from "#/api/shelters/pets/services.js";

export async function handleGetPet(req: Request, res: Response) {
  const { shelterId, petId } = shelterPetParamsSchema.parse(req.params);
  const result = await findShelterPetDetailed(shelterId, petId);

  if (!result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Pet not found" });
  }

  return res.status(StatusCodes.OK).json(result);
}

export async function handleRegisterPet(req: Request, res: Response) {
  const { shelterId } = shelterIdParamsSchema.parse(req.params);
  const body = registerPetBodySchema.parse(req.body);
  const result = await registerPet(shelterId, body);

  if ("error" in result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }

  return res.status(StatusCodes.CREATED).json(result.data);
}

export async function handleUpdatePet(req: Request, res: Response) {
  const { shelterId, petId } = shelterPetParamsSchema.parse(req.params);
  const body = updatePetBodySchema.parse(req.body);
  const result = await updatePet(shelterId, petId, body);

  if ("error" in result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }

  return res.status(StatusCodes.OK).json(result.data);
}

export async function handleDeletePet(req: Request, res: Response) {
  const { shelterId, petId } = shelterPetParamsSchema.parse(req.params);
  const deleted = await deletePet(shelterId, petId);

  if (!deleted) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Pet not found" });
  }

  return res.status(StatusCodes.OK).send();
}

export async function handleRegisterVaccination(req: Request, res: Response) {
  const { shelterId, petId } = shelterPetParamsSchema.parse(req.params);
  const { vaccineCode, administeredAt } = registerVaccinationBodySchema.parse(
    req.body,
  );
  const result = await registerVaccination(
    shelterId,
    petId,
    vaccineCode,
    administeredAt,
  );

  if ("error" in result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }

  return res.status(StatusCodes.CREATED).json(result.data);
}

export async function handleRegisterEvent(req: Request, res: Response) {
  const { shelterId, petId } = shelterPetParamsSchema.parse(req.params);
  const { name, description } = registerEventBodySchema.parse(req.body);
  const result = await registerEvent(shelterId, petId, name, description);

  if ("error" in result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }

  return res.status(StatusCodes.CREATED).json(result.data);
}

export async function handleDeleteEvent(req: Request, res: Response) {
  const { shelterId, petId, eventId } = petEventParamsSchema.parse(req.params);
  const result = await deleteEvent(shelterId, petId, eventId);

  if ("error" in result) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: result.error });
  }

  return res.status(StatusCodes.OK).send();
}

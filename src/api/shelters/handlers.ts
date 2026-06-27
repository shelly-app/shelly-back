import type { Request, Response } from "express";
import { StatusCodes } from "@/api/constants";
import { shelterIdParamsSchema } from "@/api/shelters/schemas";
import {
  findAllShelters,
  findShelterById,
  findShelterPets,
} from "@/api/shelters/services";

export async function getAllShelters(_req: Request, res: Response) {
  const shelters = await findAllShelters();
  return res.status(StatusCodes.OK).json(shelters);
}

export async function getShelter(req: Request, res: Response) {
  const { id } = shelterIdParamsSchema.parse(req.params);
  const shelter = await findShelterById(id);

  if (!shelter) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Shelter not found" });
  }

  return res.status(StatusCodes.OK).json(shelter);
}

export async function getShelterPets(req: Request, res: Response) {
  const { id } = shelterIdParamsSchema.parse(req.params);
  const pets = await findShelterPets(id);
  return res.status(StatusCodes.OK).json(pets);
}

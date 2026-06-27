import type { Request, Response } from "express";
import { StatusCodes } from "@/api/constants";
import { petIdParamsSchema } from "@/api/pets/schemas";
import {
  findAllColors,
  findAllPublicPets,
  findAllSpecies,
  findAllStatuses,
  findAllVaccines,
  findPublicPetById,
} from "@/api/pets/services";

export async function getAllPets(_req: Request, res: Response) {
  const pets = await findAllPublicPets();
  return res.status(StatusCodes.OK).json(pets);
}

export async function getPet(req: Request, res: Response) {
  const { id } = petIdParamsSchema.parse(req.params);
  const pet = await findPublicPetById(id);

  if (!pet) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "Pet not found" });
  }

  return res.status(StatusCodes.OK).json(pet);
}

export async function getColors(_req: Request, res: Response) {
  const colors = await findAllColors();
  return res.status(StatusCodes.OK).json(colors);
}

export async function getSpecies(_req: Request, res: Response) {
  const species = await findAllSpecies();
  return res.status(StatusCodes.OK).json(species);
}

export async function getStatus(_req: Request, res: Response) {
  const status = await findAllStatuses();
  return res.status(StatusCodes.OK).json(status);
}

export async function getVaccines(_req: Request, res: Response) {
  const vaccines = await findAllVaccines();
  return res.status(StatusCodes.OK).json(vaccines);
}

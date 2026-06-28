import type { Request, Response } from "express";
import { StatusCodes } from "@/api/constants";
import {
  adoptionRequestParamsSchema,
  createAdoptionRequestBodySchema,
  listAdoptionRequestsQuerySchema,
  shelterIdParamsSchema,
  shelterPetParamsSchema,
  updateAdoptionRequestBodySchema,
} from "@/api/shelters/adoption-requests/schemas";
import {
  createAdoptionRequest,
  listShelterAdoptionRequests,
  updateAdoptionRequestStatus,
} from "@/api/shelters/adoption-requests/services";

export async function handleListAdoptionRequests(req: Request, res: Response) {
  const { shelterId } = shelterIdParamsSchema.parse(req.params);
  const { status } = listAdoptionRequestsQuerySchema.parse(req.query);

  const requests = await listShelterAdoptionRequests(shelterId, status);
  return res.status(StatusCodes.OK).json(requests);
}

export async function handleCreateAdoptionRequest(req: Request, res: Response) {
  const { shelterId, petId } = shelterPetParamsSchema.parse(req.params);
  const body = createAdoptionRequestBodySchema.parse(req.body);

  const result = await createAdoptionRequest(shelterId, petId, body);

  if ("data" in result) {
    return res.status(StatusCodes.CREATED).json(result.data);
  }

  return res.status(result.status).json({ error: result.error });
}

export async function handleUpdateAdoptionRequest(req: Request, res: Response) {
  const { shelterId, requestId } = adoptionRequestParamsSchema.parse(
    req.params,
  );
  const body = updateAdoptionRequestBodySchema.parse(req.body);

  const result = await updateAdoptionRequestStatus(
    shelterId,
    requestId,
    body.status,
    body.rejectionReason,
  );

  if ("data" in result) {
    return res.status(StatusCodes.OK).json(result.data);
  }

  return res.status(result.status).json({ error: result.error });
}

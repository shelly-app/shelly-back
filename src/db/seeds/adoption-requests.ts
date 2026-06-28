import type { db } from "@/db";
import { adoptionRequests, pet } from "@/db/schema";

/**
 * Seeds a couple of adoption requests per shelter so the management UI has data
 * to render in development. Requests are attached to existing seeded pets.
 */
export async function seedAdoptionRequests(db: db) {
  const pets = await db.select().from(pet);

  if (pets.length === 0) return;

  const samples = [
    {
      requesterName: "Juan Pérez",
      requesterEmail: "juan@example.com",
      requesterPhone: "+5491112345678",
      status: "pending" as const,
      message: "Me encantaría adoptar y ofrecerle un hogar amoroso.",
      location: "CABA, Buenos Aires, Argentina",
      familyComposition: "Soltero",
      hasYard: false,
    },
    {
      requesterName: "María García",
      requesterEmail: "maria@example.com",
      requesterPhone: "+5491122334455",
      status: "approved" as const,
      message: "Tengo experiencia con animales y un gran jardín.",
      location: "San Antonio de Areco, Buenos Aires, Argentina",
      familyComposition: "Casada, 2 hijos",
      hasYard: true,
      approvedAt: new Date().toISOString(),
    },
    {
      requesterName: "Carlos López",
      requesterEmail: "carlos@example.com",
      requesterPhone: "+5491133445566",
      status: "rejected" as const,
      message: "Busco un compañero para mi familia.",
      rejectionReason: "No pudimos contactar al solicitante.",
      location: "Campana, Buenos Aires, Argentina",
      familyComposition: "Soltero, 1 hija",
      hasYard: false,
      rejectedAt: new Date().toISOString(),
    },
  ];

  const values = samples
    .map((sample, index) => {
      const targetPet = pets[index];
      if (!targetPet) return null;
      return {
        ...sample,
        petId: targetPet.id,
        shelterId: targetPet.shelterId,
      };
    })
    .filter((value) => value !== null);

  if (values.length === 0) return;

  await db.insert(adoptionRequests).values(values);
}

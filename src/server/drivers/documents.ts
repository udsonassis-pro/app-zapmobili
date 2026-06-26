import { prisma } from "@/lib/prisma";
import {
  reviewDriverDocumentSchema,
  submitDriverDocumentSchema,
  type ReviewDriverDocumentInput,
  type SubmitDriverDocumentInput,
} from "@/server/drivers/document-schemas";

export async function listDriverDocuments(userId: string) {
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!driver || driver.deletedAt) {
    throw new Error("Perfil de motorista nao encontrado.");
  }

  return {
    driver,
    documents: driver.documents,
  };
}

export async function submitDriverDocument(
  userId: string,
  input: SubmitDriverDocumentInput,
) {
  const parsed = submitDriverDocumentSchema.parse(input);
  const driver = await prisma.driverProfile.findUnique({
    where: { userId },
  });

  if (!driver || driver.deletedAt) {
    throw new Error("Perfil de motorista nao encontrado.");
  }

  return prisma.driverDocument.create({
    data: {
      tenantId: driver.tenantId,
      driverId: driver.id,
      type: parsed.type,
      fileUrl: parsed.fileUrl,
      status: "PENDING",
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
    },
  });
}

export async function listTenantDriverDocuments(tenantSlug: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Tenant nao encontrado.");
  }

  const documents = await prisma.driverDocument.findMany({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      driver: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return { tenant, documents };
}

export async function reviewTenantDriverDocument(
  tenantSlug: string,
  documentId: string,
  input: ReviewDriverDocumentInput,
) {
  const parsed = reviewDriverDocumentSchema.parse(input);
  const { tenant } = await listTenantDriverDocuments(tenantSlug);

  return prisma.driverDocument.update({
    where: {
      id: documentId,
      tenantId: tenant.id,
    },
    data: {
      status: parsed.decision === "APPROVE" ? "APPROVED" : "REJECTED",
      reviewedAt: new Date(),
      reviewNote: parsed.note ?? null,
    },
    include: {
      driver: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
}

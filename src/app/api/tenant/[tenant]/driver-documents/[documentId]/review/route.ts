import { requireTenantRole } from "@/server/auth/session";
import { reviewDriverDocumentSchema } from "@/server/drivers/document-schemas";
import { reviewTenantDriverDocument } from "@/server/drivers/documents";

export async function POST(
  request: Request,
  context: RouteContext<"/api/tenant/[tenant]/driver-documents/[documentId]/review">,
) {
  const { tenant, documentId } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "SUPPORT"]);
  const body = await request.json();
  const parsed = reviewDriverDocumentSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Decisao invalida para o documento." },
      { status: 400 },
    );
  }

  try {
    const document = await reviewTenantDriverDocument(
      tenant,
      documentId,
      parsed.data,
    );

    return Response.json({
      document: {
        id: document.id,
        type: document.type,
        status: document.status,
        driver: document.driver.user.name,
        reviewedAt: document.reviewedAt,
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel revisar documento.",
      },
      { status: 400 },
    );
  }
}

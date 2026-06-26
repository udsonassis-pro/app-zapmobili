import { requireTenantRole } from "@/server/auth/session";
import { listTenantDriverDocuments } from "@/server/drivers/documents";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/tenant/[tenant]/driver-documents">,
) {
  const { tenant } = await context.params;
  await requireTenantRole(tenant, ["TENANT_ADMIN", "SUPPORT"]);
  const result = await listTenantDriverDocuments(tenant);

  return Response.json({
    documents: result.documents.map((document) => ({
      id: document.id,
      type: document.type,
      fileUrl: document.fileUrl,
      status: document.status,
      reviewNote: document.reviewNote,
      driver: document.driver.user.name,
      driverEmail: document.driver.user.email,
      createdAt: document.createdAt,
      reviewedAt: document.reviewedAt,
    })),
  });
}

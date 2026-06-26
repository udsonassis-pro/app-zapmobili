import { headers } from "next/headers";
import { resolveTenantFromHost } from "@/server/tenancy/tenant-resolver";

export async function GET() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";

  return Response.json({
    tenant: resolveTenantFromHost(host),
    host,
  });
}

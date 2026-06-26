import { notifyAllTenantsSupportSlaRisks } from "@/server/support/sla-alerts";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return false;
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : new URL(request.url).searchParams.get("secret");

  return token === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const result = await notifyAllTenantsSupportSlaRisks();

  return Response.json({
    ok: true,
    ...result,
  });
}

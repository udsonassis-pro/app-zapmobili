import { getSession } from "@/server/auth/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json({ user: null }, { status: 401 });
  }

  return Response.json({
    user: {
      name: session.name,
      email: session.email,
      tenantId: session.tenantId,
      roles: session.roles,
    },
  });
}

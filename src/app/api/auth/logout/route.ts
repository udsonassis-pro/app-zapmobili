import { clearSessionCookie } from "@/server/auth/session";

export async function POST() {
  await clearSessionCookie();

  return Response.json({ ok: true });
}

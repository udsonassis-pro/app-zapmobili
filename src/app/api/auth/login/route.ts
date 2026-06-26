import { z } from "zod";
import { authenticateUser, setSessionCookie } from "@/server/auth/session";

const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginRequestSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Informe e-mail e senha validos." },
      { status: 400 },
    );
  }

  const session = await authenticateUser(parsed.data);

  if (!session) {
    return Response.json(
      { error: "E-mail ou senha invalidos." },
      { status: 401 },
    );
  }

  await setSessionCookie(session);

  return Response.json({
    user: {
      name: session.name,
      email: session.email,
      tenantId: session.tenantId,
      roles: session.roles,
    },
  });
}

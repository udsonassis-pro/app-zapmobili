import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  verifySessionToken,
  type AuthSession,
} from "@/server/auth/token";
import type { RoleName } from "@/generated/prisma/enums";

export const sessionCookieName = "zapmobili_session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export async function authenticateUser(input: LoginInput) {
  const parsed = loginSchema.parse(input);
  const user = await prisma.user.findUnique({
    where: { email: parsed.email.toLowerCase() },
    include: { roles: true },
  });

  if (!user || user.status !== "ACTIVE" || user.deletedAt) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(parsed.password, user.passwordHash);

  if (!passwordMatches) {
    return null;
  }

  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    roles: user.roles.map((role) => role.name),
  } satisfies AuthSession;
}

export async function setSessionCookie(session: AuthSession) {
  const token = await createSessionToken(session);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAnyRole(roles: RoleName[]) {
  const session = await requireSession();
  const allowed = roles.some((role) => session.roles.includes(role));

  if (!allowed) {
    redirect("/sem-acesso");
  }

  return session;
}

export async function requireTenantRole(tenantSlug: string, roles: RoleName[]) {
  const session = await requireAnyRole(["SUPER_ADMIN", ...roles]);

  if (session.roles.includes("SUPER_ADMIN")) {
    return session;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant || tenant.id !== session.tenantId) {
    redirect("/sem-acesso");
  }

  return session;
}

import { SignJWT, jwtVerify } from "jose";
import { z } from "zod";

export const sessionPayloadSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  name: z.string(),
  tenantId: z.string().nullable(),
  roles: z.array(z.string()),
});

export type AuthSession = z.infer<typeof sessionPayloadSchema>;

export function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret === "troque-por-um-segredo-forte") {
    throw new Error("AUTH_SECRET precisa ser configurado com um valor forte.");
  }

  return new TextEncoder().encode(secret);
}

export async function createSessionToken(session: AuthSession) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getAuthSecret());
}

export async function verifySessionToken(token: string) {
  const verified = await jwtVerify(token, getAuthSecret());
  return sessionPayloadSchema.parse(verified.payload);
}

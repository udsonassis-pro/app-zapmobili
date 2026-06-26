import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "@/server/auth/token";

describe("auth token", () => {
  it("assina e valida uma sessao", async () => {
    process.env.AUTH_SECRET = "test-secret-with-enough-length";

    const token = await createSessionToken({
      sub: "user_1",
      email: "admin@zapmobili.com.br",
      name: "Admin",
      tenantId: null,
      roles: ["SUPER_ADMIN"],
    });

    const session = await verifySessionToken(token);

    expect(session.email).toBe("admin@zapmobili.com.br");
    expect(session.roles).toContain("SUPER_ADMIN");
  });
});

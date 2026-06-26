import { describe, expect, it } from "vitest";
import {
  resolveTenantFromHost,
  resolveTenantFromRoute,
} from "@/server/tenancy/tenant-resolver";

describe("tenant resolver", () => {
  it("resolve tenant por rota local", () => {
    expect(resolveTenantFromRoute("demo")).toEqual({
      slug: "demo",
      source: "route",
    });
  });

  it("resolve tenant por subdominio", () => {
    expect(resolveTenantFromHost("demo.zapmobili.com.br")).toEqual({
      slug: "demo",
      source: "subdomain",
    });
  });

  it("ignora host da plataforma", () => {
    expect(resolveTenantFromHost("zapmobili.com.br")).toBeNull();
    expect(resolveTenantFromHost("localhost:3000")).toBeNull();
  });
});

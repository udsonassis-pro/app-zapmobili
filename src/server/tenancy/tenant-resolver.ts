import { z } from "zod";

export const tenantRouteSchema = z.object({
  tenant: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
});

export type TenantContext = {
  slug: string;
  source: "route" | "subdomain" | "custom-domain";
};

const platformHosts = new Set(["localhost", "127.0.0.1", "zapmobili.com.br"]);

export function resolveTenantFromHost(host: string): TenantContext | null {
  const hostname = host.split(":")[0]?.toLowerCase();

  if (!hostname || platformHosts.has(hostname) || hostname.startsWith("www.")) {
    return null;
  }

  if (hostname.endsWith(".zapmobili.com.br")) {
    const slug = hostname.replace(".zapmobili.com.br", "");
    return tenantRouteSchema.safeParse({ tenant: slug }).success
      ? { slug, source: "subdomain" }
      : null;
  }

  return {
    slug: hostname,
    source: "custom-domain",
  };
}

export function resolveTenantFromRoute(slug: string): TenantContext {
  const parsed = tenantRouteSchema.parse({ tenant: slug });
  return {
    slug: parsed.tenant,
    source: "route",
  };
}

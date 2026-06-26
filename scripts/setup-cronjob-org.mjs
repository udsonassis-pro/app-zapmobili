import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env");

function loadEnvFile() {
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^"|"$/g, "");
    process.env[key] ??= value;
  }
}

function getPublicAppUrl() {
  const rawUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (!rawUrl) {
    throw new Error("APP_URL ou NEXT_PUBLIC_APP_URL nao configurada.");
  }

  const appUrl = new URL(rawUrl);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

  if (appUrl.protocol !== "https:" || localHosts.has(appUrl.hostname)) {
    throw new Error(
      `URL publica invalida para cron-job.org: ${appUrl.host}. Configure APP_URL com HTTPS publico.`,
    );
  }

  return appUrl;
}

function buildTargetUrl(appUrl) {
  const target = new URL("/api/cron/support-sla-alerts", appUrl);
  target.searchParams.set("secret", process.env.CRON_SECRET);
  return target;
}

async function cronJobRequest(pathname, init = {}) {
  const response = await fetch(`https://api.cron-job.org${pathname}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRONJOB_API_KEY}`,
      ...(init.headers ?? {}),
    },
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(
      `cron-job.org retornou ${response.status}: ${JSON.stringify(payload)}`,
    );
  }

  return payload;
}

async function main() {
  loadEnvFile();

  if (!process.env.CRONJOB_API_KEY) {
    throw new Error("CRONJOB_API_KEY nao configurada.");
  }

  if (!process.env.CRON_SECRET) {
    throw new Error("CRON_SECRET nao configurada.");
  }

  const appUrl = getPublicAppUrl();
  const targetUrl = buildTargetUrl(appUrl);
  const title = process.env.CRONJOB_JOB_TITLE || "Zap Mobili - SLA suporte";
  const job = {
    title,
    url: targetUrl.toString(),
    enabled: true,
    saveResponses: true,
    requestMethod: 0,
    requestTimeout: 30,
    schedule: {
      timezone: "America/Sao_Paulo",
      expiresAt: 0,
      hours: [-1],
      mdays: [-1],
      minutes: [0, 15, 30, 45],
      months: [-1],
      wdays: [-1],
    },
  };

  const existingJobs = await cronJobRequest("/jobs");
  const existing = existingJobs.jobs?.find((item) => item.title === title);

  if (existing) {
    await cronJobRequest(`/jobs/${existing.jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ job }),
    });

    console.log(
      JSON.stringify(
        {
          action: "updated",
          jobId: existing.jobId,
          title,
          targetHost: targetUrl.host,
          schedule: "*/15 minutes",
        },
        null,
        2,
      ),
    );
    return;
  }

  const created = await cronJobRequest("/jobs", {
    method: "PUT",
    body: JSON.stringify({ job }),
  });

  console.log(
    JSON.stringify(
      {
        action: "created",
        jobId: created.jobId,
        title,
        targetHost: targetUrl.host,
        schedule: "*/15 minutes",
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

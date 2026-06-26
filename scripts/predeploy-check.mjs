import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const args = process.argv.slice(2);
const targetEnvironment = args.find((arg) => !arg.startsWith("--"))?.toLowerCase();
const skipTests = args.includes("--skip-tests");
const skipBuild = args.includes("--skip-build");
const skipMigrations = args.includes("--skip-migrations");

const validTargets = ["develop", "homolog", "producao"];

function printUsage() {
  console.log("Uso:");
  console.log("  npm run predeploy -- develop");
  console.log("  npm run predeploy -- homolog");
  console.log("  npm run predeploy -- producao");
  console.log("  npm run predeploy -- homolog --skip-build");
}

function unquote(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseEnv(content) {
  const values = new Map();
  const counts = new Map();

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    const key = match[1];
    values.set(key, unquote(match[2]));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return { values, counts };
}

function normalizeUrl(value) {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";

    return url.toString();
  } catch {
    return value;
  }
}

function describeUrl(value) {
  try {
    const url = new URL(value);

    return `host=${url.host}; banco=${url.pathname.replace(/^\//, "") || "(sem nome)"}`;
  } catch {
    return "URL invalida";
  }
}

function isLocalUrl(value) {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function detectEnvironment(env) {
  const activeUrl = env.get("DATABASE_URL");

  if (!activeUrl) {
    return null;
  }

  const candidates = [
    ["develop", "DATABASE_URL_DEVELOP"],
    ["homolog", "DATABASE_URL_HOMOLOG"],
    ["producao", "DATABASE_URL_PRODUCAO"],
  ];

  for (const [name, key] of candidates) {
    const value = env.get(key);

    if (value && normalizeUrl(value) === normalizeUrl(activeUrl)) {
      return { name, sourceKey: key };
    }
  }

  return { name: "desconhecido", sourceKey: "DATABASE_URL" };
}

function runCommand(command, commandArgs) {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;

  return process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", executable, ...commandArgs], {
        stdio: "inherit",
      })
    : spawnSync(executable, commandArgs, {
        stdio: "inherit",
      });
}

function runStep(label, command, commandArgs) {
  console.log(`\n[check] ${label}`);

  const result = runCommand(command, commandArgs);

  if (result.error) {
    console.error(result.error.message);
  }

  return result.status === 0;
}

function requireValue(env, key, failures) {
  if (!env.get(key)) {
    failures.push(`Variavel obrigatoria ausente ou vazia: ${key}`);
  }
}

if (targetEnvironment && !validTargets.includes(targetEnvironment)) {
  console.error(`Ambiente invalido: ${targetEnvironment}`);
  printUsage();
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error("Arquivo .env nao encontrado. Crie a partir do .env.example primeiro.");
  process.exit(1);
}

const { values: env, counts } = parseEnv(readFileSync(envPath, "utf8"));
const failures = [];
const warnings = [];
const detected = detectEnvironment(env);

for (const [key, count] of counts.entries()) {
  if (count > 1) {
    failures.push(`Variavel duplicada no .env: ${key}`);
  }
}

if (!detected) {
  failures.push("DATABASE_URL nao configurada no .env.");
} else if (detected.name === "desconhecido") {
  failures.push("DATABASE_URL ativo nao corresponde a DEVELOP, HOMOLOG ou PRODUCAO.");
} else if (targetEnvironment && detected.name !== targetEnvironment) {
  failures.push(
    `Ambiente solicitado (${targetEnvironment}) difere do banco ativo (${detected.name}).`,
  );
}

requireValue(env, "DATABASE_URL", failures);
requireValue(env, "AUTH_SECRET", failures);
requireValue(env, "APP_URL", failures);
requireValue(env, "NEXT_PUBLIC_APP_NAME", failures);
requireValue(env, "CRON_SECRET", failures);

const effectiveEnvironment = targetEnvironment ?? detected?.name;
const appUrl = env.get("APP_URL") ?? "";
const publicAppUrl = env.get("NEXT_PUBLIC_APP_URL") ?? "";
const paymentProvider = env.get("PAYMENT_PROVIDER") ?? "";
const realtimeProvider = env.get("REALTIME_PROVIDER") ?? "";

if (effectiveEnvironment && ["homolog", "producao"].includes(effectiveEnvironment)) {
  requireValue(env, "NEXT_PUBLIC_APP_URL", failures);
  requireValue(env, "CRONJOB_API_KEY", failures);

  if (isLocalUrl(appUrl) || isLocalUrl(publicAppUrl)) {
    failures.push("APP_URL/NEXT_PUBLIC_APP_URL nao podem apontar para localhost em homologacao/producao.");
  }
}

if (effectiveEnvironment === "producao") {
  requireValue(env, "SENTRY_DSN", failures);
  requireValue(env, "REDIS_URL", failures);
  requireValue(env, "PAYMENT_WEBHOOK_SECRET", failures);

  if (!isHttpsUrl(appUrl) || !isHttpsUrl(publicAppUrl)) {
    failures.push("APP_URL e NEXT_PUBLIC_APP_URL devem usar HTTPS em producao.");
  }

  if (!paymentProvider || paymentProvider === "mock") {
    failures.push("PAYMENT_PROVIDER deve ser um provider real em producao.");
  }

  if (!realtimeProvider || realtimeProvider === "mock") {
    failures.push("REALTIME_PROVIDER deve ser um provider real em producao.");
  }
}

if (effectiveEnvironment === "develop") {
  if (!env.get("CRONJOB_API_KEY")) {
    warnings.push("CRONJOB_API_KEY ausente: configuracao do cron-job.org fica pendente.");
  }
} else if (env.get("CRONJOB_API_KEY") && !appUrl) {
  failures.push("CRONJOB_API_KEY configurada, mas APP_URL ausente.");
}

console.log("Pre-deploy Zap Mobili");
console.log(`Ambiente ativo: ${detected?.name ?? "nao identificado"}`);
console.log(`Origem do banco: ${detected?.sourceKey ?? "nao identificada"}`);
console.log(`Banco ativo: ${describeUrl(env.get("DATABASE_URL") ?? "")}`);
console.log("Senha e usuario nao foram exibidos.");

if (warnings.length > 0) {
  console.log("\nAvisos:");

  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

if (failures.length > 0) {
  console.error("\nFalhas encontradas:");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

const steps = [];

if (!skipMigrations) {
  steps.push(["Status das migrations", "npx", ["prisma", "migrate", "status"]]);
}

if (!skipTests) {
  steps.push(["Testes", "npm", ["run", "test"]]);
  steps.push(["Lint", "npm", ["run", "lint"]]);
}

if (!skipBuild) {
  steps.push(["Build", "npm", ["run", "build"]]);
}

for (const [label, command, commandArgs] of steps) {
  if (!runStep(label, command, commandArgs)) {
    console.error(`\nPre-deploy interrompido: ${label} falhou.`);
    process.exit(1);
  }
}

console.log("\nPre-deploy aprovado.");

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

const urls = {
  develop: "https://app-zapmobili-git-develop-udsonassis-projects.vercel.app",
  homolog: "https://app-zapmobili-git-homolog-udsonassis-projects.vercel.app",
  producao: "https://app-zapmobili-udsonassis-projects.vercel.app",
};

const targets = [
  {
    name: "develop",
    vercelEnvironment: "preview",
    branch: "develop",
    databaseKey: "DATABASE_URL_DEVELOP",
  },
  {
    name: "homolog",
    vercelEnvironment: "preview",
    branch: "homolog",
    databaseKey: "DATABASE_URL_HOMOLOG",
  },
  {
    name: "producao",
    vercelEnvironment: "production",
    databaseKey: "DATABASE_URL_PRODUCAO",
  },
];

const copiedKeys = [
  "AUTH_SECRET",
  "CRON_SECRET",
  "CRONJOB_API_KEY",
  "NEXT_PUBLIC_APP_NAME",
  "REDIS_URL",
  "PAYMENT_PROVIDER",
  "PAYMENT_WEBHOOK_SECRET",
  "REALTIME_PROVIDER",
  "REALTIME_API_KEY",
  "SENTRY_DSN",
  "LOG_LEVEL",
];

function printUsage() {
  console.log("Uso:");
  console.log("  npm run vercel:env:sync");
  console.log("  npm run vercel:env:sync -- --target homolog");
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

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    values.set(match[1], unquote(match[2]));
  }

  return values;
}

function runVercelEnvAdd(key, value, target) {
  const executable = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = [
    "vercel",
    "env",
    "add",
    key,
    target.vercelEnvironment,
    ...(target.branch ? [target.branch] : []),
    "--force",
    "--sensitive",
    "--yes",
  ];

  const result = process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", executable, ...args], {
        input: `${value}\n`,
        encoding: "utf8",
      })
    : spawnSync(executable, args, {
        input: `${value}\n`,
        encoding: "utf8",
      });


  if (result.status !== 0) {
    const details = [
      result.error?.message,
      result.stdout,
      result.stderr,
      typeof result.status === "number" ? `exit=${result.status}` : null,
      result.signal ? `signal=${result.signal}` : null,
    ].filter(Boolean);
    const message = details.join("\n").trim();
    throw new Error(message || `Falha ao enviar ${key} para ${target.name}.`);
  }
}

if (!existsSync(envPath)) {
  console.error("Arquivo .env nao encontrado.");
  process.exit(1);
}

const args = process.argv.slice(2);
const targetIndex = args.indexOf("--target");
const targetName = targetIndex === -1 ? null : args[targetIndex + 1]?.toLowerCase();

if (targetIndex !== -1 && !targetName) {
  printUsage();
  process.exit(1);
}

const selectedTargets = targetName
  ? targets.filter((target) => target.name === targetName)
  : targets;

if (selectedTargets.length === 0) {
  console.error(`Ambiente invalido: ${targetName}`);
  printUsage();
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, "utf8"));

for (const target of selectedTargets) {
  const entries = [
    ["DATABASE_URL", env.get(target.databaseKey)],
    ["APP_URL", urls[target.name]],
    ["NEXT_PUBLIC_APP_URL", urls[target.name]],
    ...copiedKeys.map((key) => [key, env.get(key)]),
  ].filter(([, value]) => Boolean(value));

  console.log(`Sincronizando ${target.name} (${target.vercelEnvironment})...`);

  for (const [key, value] of entries) {
    runVercelEnvAdd(key, value, target);
    console.log(`- ${key}`);
  }
}

console.log("Variaveis sincronizadas sem exibir valores.");

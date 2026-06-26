import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

const commands = {
  migrate: {
    label: "migration de desenvolvimento",
    allowedEnvironments: ["develop"],
    command: ["npx", ["prisma", "migrate", "dev"]],
  },
  deploy: {
    label: "deploy de migrations",
    allowedEnvironments: ["develop", "homolog", "producao"],
    command: ["npx", ["prisma", "migrate", "deploy"]],
    requiresProductionConfirmation: true,
  },
  seed: {
    label: "seed",
    allowedEnvironments: ["develop", "homolog", "producao"],
    command: ["npx", ["tsx", "prisma/seed.ts"]],
    requiresProductionConfirmation: true,
  },
};

const args = process.argv.slice(2);
const commandName = args.find((arg) => !arg.startsWith("--"));
const passthroughArgs = args.filter((arg) => arg !== commandName);
const confirmProduction = args.includes("--confirm-producao");

function printUsage() {
  console.log("Uso:");
  console.log("  npm run db:migrate");
  console.log("  npm run db:seed");
  console.log("  npm run db:deploy");
  console.log("  npm run db:deploy -- --confirm-producao");
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

function describeActiveDatabase(env) {
  const activeUrl = env.get("DATABASE_URL");

  if (!activeUrl) {
    return "DATABASE_URL ausente";
  }

  try {
    const url = new URL(activeUrl);
    return `host=${url.host}; banco=${url.pathname.replace(/^\//, "") || "(sem nome)"}`;
  } catch {
    return "DATABASE_URL invalida";
  }
}

if (!commandName || !commands[commandName]) {
  console.error("Comando de banco invalido ou ausente.");
  printUsage();
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error("Arquivo .env nao encontrado. Crie a partir do .env.example primeiro.");
  process.exit(1);
}

const command = commands[commandName];
const env = parseEnv(readFileSync(envPath, "utf8"));
const detected = detectEnvironment(env);

if (!detected) {
  console.error("DATABASE_URL nao configurada no .env.");
  process.exit(1);
}

if (!command.allowedEnvironments.includes(detected.name)) {
  console.error(`${command.label} bloqueado no ambiente ${detected.name}.`);
  console.error(`Banco ativo: ${describeActiveDatabase(env)}`);
  console.error("Use npm run db:use -- develop antes de rodar este comando.");
  process.exit(1);
}

if (
  detected.name === "producao" &&
  command.requiresProductionConfirmation &&
  !confirmProduction
) {
  console.error("Comando em producao bloqueado por seguranca.");
  console.error("Para confirmar, rode: npm run db:deploy -- --confirm-producao");
  process.exit(1);
}

const [executable, executableArgs] = command.command;
const filteredPassthroughArgs = passthroughArgs.filter((arg) => arg !== "--confirm-producao");
const platformExecutable = process.platform === "win32" ? `${executable}.cmd` : executable;

console.log(`${command.label} liberado para ${detected.name}.`);
console.log(`Banco ativo: ${describeActiveDatabase(env)}`);
console.log("Senha e usuario nao foram exibidos.");

const result =
  process.platform === "win32"
    ? spawnSync("cmd.exe", [
        "/d",
        "/s",
        "/c",
        platformExecutable,
        ...executableArgs,
        ...filteredPassthroughArgs,
      ], {
        stdio: "inherit",
      })
    : spawnSync(platformExecutable, [...executableArgs, ...filteredPassthroughArgs], {
        stdio: "inherit",
      });

process.exit(result.status ?? 1);

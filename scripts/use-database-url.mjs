import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");

const aliases = {
  develop: {
    label: "desenvolvimento",
    sourceKey: "DATABASE_URL_DEVELOP",
  },
  dev: {
    label: "desenvolvimento",
    sourceKey: "DATABASE_URL_DEVELOP",
  },
  desenvolvimento: {
    label: "desenvolvimento",
    sourceKey: "DATABASE_URL_DEVELOP",
  },
  homolog: {
    label: "homologacao",
    sourceKey: "DATABASE_URL_HOMOLOG",
  },
  homologacao: {
    label: "homologacao",
    sourceKey: "DATABASE_URL_HOMOLOG",
  },
  staging: {
    label: "homologacao",
    sourceKey: "DATABASE_URL_HOMOLOG",
  },
  producao: {
    label: "producao",
    sourceKey: "DATABASE_URL_PRODUCAO",
    requiresConfirmation: true,
  },
  prod: {
    label: "producao",
    sourceKey: "DATABASE_URL_PRODUCAO",
    requiresConfirmation: true,
  },
  production: {
    label: "producao",
    sourceKey: "DATABASE_URL_PRODUCAO",
    requiresConfirmation: true,
  },
};

const args = process.argv.slice(2);
const targetName = args.find((arg) => !arg.startsWith("--"))?.toLowerCase();
const confirmProduction = args.includes("--confirm-producao");

function printUsage() {
  console.log("Uso:");
  console.log("  npm run db:use -- develop");
  console.log("  npm run db:use -- homolog");
  console.log("  npm run db:use -- producao --confirm-producao");
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

function parseEnv(lines) {
  const values = new Map();

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    values.set(match[1], unquote(match[2]));
  }

  return values;
}

function quoteEnv(value) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function describeUrl(value) {
  try {
    const url = new URL(value);

    return {
      protocolo: url.protocol.replace(":", ""),
      host: url.host,
      banco: url.pathname.replace(/^\//, "") || "(sem nome)",
    };
  } catch {
    return {
      protocolo: "(url invalida)",
      host: "(nao identificado)",
      banco: "(nao identificado)",
    };
  }
}

function updateDatabaseUrl(lines, sourceKey, targetValue) {
  let firstDatabaseUrlIndex = -1;
  let sourceKeyIndex = -1;
  const output = [];

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    const key = match?.[1];

    if (key === sourceKey && sourceKeyIndex === -1) {
      sourceKeyIndex = output.length;
    }

    if (key === "DATABASE_URL") {
      if (firstDatabaseUrlIndex === -1) {
        firstDatabaseUrlIndex = output.length;
        output.push(`DATABASE_URL=${quoteEnv(targetValue)}`);
      }

      continue;
    }

    output.push(line);
  }

  if (firstDatabaseUrlIndex !== -1) {
    return output;
  }

  const insertAt = sourceKeyIndex === -1 ? 0 : sourceKeyIndex + 1;
  output.splice(insertAt, 0, `DATABASE_URL=${quoteEnv(targetValue)}`);

  return output;
}

if (!targetName || !aliases[targetName]) {
  console.error("Ambiente invalido ou ausente.");
  printUsage();
  process.exit(1);
}

const target = aliases[targetName];

if (target.requiresConfirmation && !confirmProduction) {
  console.error("Troca para producao bloqueada por seguranca.");
  console.error("Para confirmar, rode: npm run db:use -- producao --confirm-producao");
  process.exit(1);
}

if (!existsSync(envPath)) {
  console.error("Arquivo .env nao encontrado. Crie a partir do .env.example primeiro.");
  process.exit(1);
}

const original = readFileSync(envPath, "utf8");
const lineEnding = original.includes("\r\n") ? "\r\n" : "\n";
const hadFinalNewline = original.endsWith("\n");
const rawLines = original.split(/\r?\n/);
const lines = hadFinalNewline ? rawLines.slice(0, -1) : rawLines;
const env = parseEnv(lines);
const targetValue = env.get(target.sourceKey);

if (!targetValue) {
  console.error(`Variavel ${target.sourceKey} nao encontrada ou vazia no .env.`);
  process.exit(1);
}

const updatedLines = updateDatabaseUrl(lines, target.sourceKey, targetValue);
const updated = `${updatedLines.join(lineEnding)}${hadFinalNewline ? lineEnding : ""}`;

writeFileSync(envPath, updated);

const description = describeUrl(targetValue);

console.log(`DATABASE_URL agora aponta para ${target.label}.`);
console.log(`Origem: ${target.sourceKey}`);
console.log(
  `Destino: protocolo=${description.protocolo}; host=${description.host}; banco=${description.banco}`,
);
console.log("Senha e usuario nao foram exibidos.");

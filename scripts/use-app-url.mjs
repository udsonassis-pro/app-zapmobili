import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env");
const args = process.argv.slice(2);
const appUrl = args.find((arg) => !arg.startsWith("--"));
const allowHttp = args.includes("--allow-http");

function printUsage() {
  console.log("Uso:");
  console.log("  npm run app:url -- https://homolog.seudominio.com");
  console.log("  npm run app:url -- http://localhost:3000 --allow-http");
}

function quoteEnv(value) {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function validateUrl(value) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "Use uma URL com protocolo http ou https.";
    }

    if (url.protocol !== "https:" && !allowHttp) {
      return "Use HTTPS. Para localhost/desenvolvimento, passe --allow-http.";
    }

    return null;
  } catch {
    return "URL invalida.";
  }
}

function setEnvValue(lines, key, value) {
  let found = false;
  const output = [];

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);

    if (match?.[1] === key) {
      if (!found) {
        output.push(`${key}=${quoteEnv(value)}`);
        found = true;
      }

      continue;
    }

    output.push(line);
  }

  if (!found) {
    output.push(`${key}=${quoteEnv(value)}`);
  }

  return output;
}

if (!appUrl) {
  console.error("URL publica ausente.");
  printUsage();
  process.exit(1);
}

const validationError = validateUrl(appUrl);

if (validationError) {
  console.error(validationError);
  printUsage();
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
let updatedLines = setEnvValue(lines, "APP_URL", appUrl);
updatedLines = setEnvValue(updatedLines, "NEXT_PUBLIC_APP_URL", appUrl);

writeFileSync(envPath, `${updatedLines.join(lineEnding)}${hadFinalNewline ? lineEnding : ""}`);

const url = new URL(appUrl);

console.log("URLs do app atualizadas.");
console.log(`APP_URL/NEXT_PUBLIC_APP_URL: ${url.protocol}//${url.host}`);

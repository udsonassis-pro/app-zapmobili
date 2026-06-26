const environments = {
  develop: {
    project: "zapmobili-develop",
    branch: "develop",
    database: "zapmobili_develop",
    url: "https://dev.seudominio.com",
    required: [
      "DATABASE_URL",
      "APP_URL",
      "NEXT_PUBLIC_APP_URL",
      "AUTH_SECRET",
      "CRON_SECRET",
      "NEXT_PUBLIC_APP_NAME",
      "REDIS_URL",
      "PAYMENT_PROVIDER",
      "REALTIME_PROVIDER",
      "LOG_LEVEL",
    ],
    notes: ["PAYMENT_PROVIDER e REALTIME_PROVIDER podem ser mock em develop."],
  },
  homolog: {
    project: "zapmobili-homolog",
    branch: "homolog",
    database: "zapmobili_homolog",
    url: "https://homolog.seudominio.com",
    required: [
      "DATABASE_URL",
      "APP_URL",
      "NEXT_PUBLIC_APP_URL",
      "AUTH_SECRET",
      "CRON_SECRET",
      "CRONJOB_API_KEY",
      "NEXT_PUBLIC_APP_NAME",
      "REDIS_URL",
      "PAYMENT_PROVIDER",
      "REALTIME_PROVIDER",
      "LOG_LEVEL",
    ],
    notes: ["Use gateway e realtime em sandbox quando estiverem disponiveis."],
  },
  producao: {
    project: "zapmobili",
    branch: "main",
    database: "zapmobili",
    url: "https://app.seudominio.com",
    required: [
      "DATABASE_URL",
      "APP_URL",
      "NEXT_PUBLIC_APP_URL",
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
    ],
    notes: [
      "PAYMENT_PROVIDER e REALTIME_PROVIDER devem ser providers reais.",
      "Nao use secrets de develop ou homologacao em producao.",
    ],
  },
};

const target = process.argv[2]?.toLowerCase();
const config = environments[target];

if (!config) {
  console.error("Ambiente invalido ou ausente.");
  console.error("Uso: npm run vercel:env -- develop|homolog|producao");
  process.exit(1);
}

console.log(`Projeto Vercel: ${config.project}`);
console.log(`Branch sugerida: ${config.branch}`);
console.log(`Banco esperado: ${config.database}`);
console.log(`URL publica sugerida: ${config.url}`);
console.log("\nVariaveis obrigatorias:");

for (const key of config.required) {
  console.log(`- ${key}`);
}

if (config.notes.length > 0) {
  console.log("\nObservacoes:");

  for (const note of config.notes) {
    console.log(`- ${note}`);
  }
}

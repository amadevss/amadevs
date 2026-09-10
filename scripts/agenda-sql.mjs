/**
 * Ejecuta un archivo .sql contra Neon (conexión sin pooler, apta para DDL).
 * Uso:  node --env-file=.env scripts/agenda-sql.mjs db/migrations/001_....sql
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@vercel/postgres";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node --env-file=.env scripts/agenda-sql.mjs <archivo.sql>");
  process.exit(1);
}

const client = createClient(); // usa POSTGRES_URL_NON_POOLING
try {
  await client.connect();
  const text = await readFile(file, "utf8");
  await client.query(text); // permite varias sentencias en un solo query (sin parámetros)
  console.log(`✅ Aplicado: ${file}`);
} catch (err) {
  console.error(`❌ Error aplicando ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}

/**
 * Acceso a la base de datos (Neon Postgres vía @vercel/postgres).
 *
 * `sql` es un tagged template parametrizado y seguro contra inyección:
 *   const { rows } = await sql`select * from service where slug = ${slug}`;
 *
 * Lee la conexión de `process.env.POSTGRES_URL` (la cadena "pooled" de Neon,
 * ya presente en .env). Para DDL o scripts puntuales usamos POSTGRES_URL_NON_POOLING.
 */
export { sql, db } from "@vercel/postgres";

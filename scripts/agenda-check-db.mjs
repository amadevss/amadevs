/**
 * Verifica que el esquema de la agenda esté aplicado en Neon.
 * Uso:  node --env-file=.env scripts/agenda-check-db.mjs
 */
import { sql } from "@vercel/postgres";

const EXPECTED_TABLES = [
  "service",
  "availability_rule",
  "blackout",
  "booking",
  "payment",
  "webhook_event",
];

try {
  const { rows: version } = await sql`select version()`;
  console.log("Postgres:", version[0].version.split(" ").slice(0, 2).join(" "));

  const { rows: tables } = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by table_name`;
  const names = tables.map((t) => t.table_name);
  console.log("\nTablas encontradas:", names.join(", ") || "(ninguna)");

  const missing = EXPECTED_TABLES.filter((t) => !names.includes(t));
  if (missing.length) {
    console.error("\n❌ Faltan tablas:", missing.join(", "));
    console.error("   Corre db/schema.sql en Neon.");
    process.exit(1);
  }

  const { rows: constraints } = await sql`
    select conname from pg_constraint where conname in ('booking_no_overlap','blackout_no_overlap')`;
  console.log(
    "Constraints anti-solape:",
    constraints.map((c) => c.conname).join(", ") || "(NINGUNA — revisa el schema)",
  );

  const { rows: services } = await sql`
    select slug, name, duration_minutes, price_cents, currency, active
    from service order by sort_order`;
  console.log("\nServicios (seed):");
  for (const s of services) {
    const price = s.price_cents === 0 ? "gratis" : `$${(s.price_cents / 100).toFixed(2)} ${s.currency.toUpperCase()}`;
    console.log(`  · ${s.slug.padEnd(16)} ${String(s.duration_minutes).padStart(3)}min  ${price}${s.active ? "" : "  (inactivo)"}`);
  }

  const { rows: rules } = await sql`
    select weekday, start_time, end_time, timezone from availability_rule where active order by weekday`;
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  console.log("\nHorario:");
  for (const r of rules) {
    console.log(`  · ${days[r.weekday]}  ${r.start_time}–${r.end_time}  (${r.timezone})`);
  }

  console.log("\n✅ Esquema OK.");
  process.exit(0);
} catch (err) {
  console.error("\n❌ Error conectando/consultando:", err.message);
  process.exit(1);
}

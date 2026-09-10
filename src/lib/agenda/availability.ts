import { DateTime } from "luxon";
import {
  BOOKING_HORIZON_DAYS,
  BUFFER_MIN,
  BUSINESS_TIMEZONE,
  MIN_NOTICE_HOURS,
  SLOT_GRANULARITY_MIN,
} from "./config";
import { getBusyRanges, getRulesForWeekday, getServiceBySlug } from "./queries";
import type { Service } from "./types";

export interface Slot {
  startsAt: string; // ISO UTC
  endsAt: string;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Horarios libres para `dateStr` (YYYY-MM-DD, en la zona del negocio) y un
 * servicio. Devuelve los inicios de slot en ISO UTC.
 */
export async function getAvailableSlots(
  dateStr: string,
  serviceSlug: string,
): Promise<Slot[]> {
  const service = await getServiceBySlug(serviceSlug);
  if (!service) return [];
  return slotsForService(dateStr, service);
}

export async function slotsForService(
  dateStr: string,
  service: Service,
): Promise<Slot[]> {
  const day = DateTime.fromISO(dateStr, { zone: BUSINESS_TIMEZONE });
  if (!day.isValid) return [];

  const now = DateTime.utc();
  const earliest = now.plus({ hours: MIN_NOTICE_HOURS });
  const horizon = now.plus({ days: BOOKING_HORIZON_DAYS });
  if (day.startOf("day").toUTC() > horizon) return [];

  // luxon: 1 = lunes … 7 = domingo  →  BD: 0 = domingo … 6 = sábado
  const dbWeekday = day.weekday % 7;
  const rules = await getRulesForWeekday(dbWeekday);
  if (rules.length === 0) return [];

  const dayStartUtc = day.startOf("day").toUTC().toISO();
  const dayEndUtc = day.plus({ days: 1 }).startOf("day").toUTC().toISO();
  if (!dayStartUtc || !dayEndUtc) return [];
  const busy = await getBusyRanges(dayStartUtc, dayEndUtc);
  const busyMs = busy.map((b) => [
    new Date(b.start).getTime(),
    new Date(b.end).getTime(),
  ]);

  const dur = service.duration_minutes;
  const seen = new Set<string>();
  const slots: Slot[] = [];

  for (const rule of rules) {
    const zone = rule.timezone || BUSINESS_TIMEZONE;
    const [sh, sm] = rule.start_time.split(":").map(Number);
    const [eh, em] = rule.end_time.split(":").map(Number);

    const base = { year: day.year, month: day.month, day: day.day };
    let cursor = DateTime.fromObject({ ...base, hour: sh, minute: sm }, { zone });
    const windowEnd = DateTime.fromObject({ ...base, hour: eh, minute: em }, { zone });

    while (cursor.isValid && cursor.plus({ minutes: dur }) <= windowEnd) {
      const startUtc = cursor.toUTC();
      const endUtc = cursor.plus({ minutes: dur }).toUTC();
      const startMs = startUtc.toMillis();
      const endMs = endUtc.toMillis();
      const iso = startUtc.toISO();

      const tooSoon = startUtc < earliest;
      const clash =
        !!iso &&
        busyMs.some(([bs, be]) =>
          overlaps(startMs - BUFFER_MIN * 60_000, endMs + BUFFER_MIN * 60_000, bs, be),
        );

      if (iso && !tooSoon && !clash && !seen.has(iso)) {
        seen.add(iso);
        slots.push({ startsAt: iso, endsAt: endUtc.toISO() ?? iso });
      }
      cursor = cursor.plus({ minutes: SLOT_GRANULARITY_MIN });
    }
  }

  slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return slots;
}

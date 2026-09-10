/** Configuración de la agenda. Ajusta a tu operación. */

/** Zona horaria en la que están definidas tus reglas de horario (availability_rule). */
export const BUSINESS_TIMEZONE = "America/Tijuana";

/** Paso de la rejilla de horarios ofrecidos, en minutos (ej. 30 → :00 y :30). */
export const SLOT_GRANULARITY_MIN = 30;

/** Anticipación mínima para reservar: no se ofrecen horarios a menos de X horas. */
export const MIN_NOTICE_HOURS = 12;

/** Hasta cuántos días hacia adelante se puede reservar. */
export const BOOKING_HORIZON_DAYS = 60;

/**
 * Minutos que se aparta un horario mientras la persona completa el pago.
 * 30 = el mínimo que permite `expires_at` de Stripe Checkout, así el hold y la
 * sesión de pago vencen a la par.
 */
export const HOLD_MINUTES = 30;

/** Colchón entre sesiones, en minutos (0 = pegadas). */
export const BUFFER_MIN = 0;

/** Moneda de cobro (ISO 4217, minúsculas). Debe coincidir con la de la cuenta Stripe. */
export const CURRENCY = "mxn";

/** Prefijo de los folios públicos de reserva: CNS-XXXXXXX */
export const REFERENCE_PREFIX = "CNS";

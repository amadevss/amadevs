import { randomBytes } from "node:crypto";
import { REFERENCE_PREFIX } from "./config";

// Sin caracteres ambiguos (0/O, 1/I/L) para poder dictarlo por teléfono.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 7;

/** Folio público de una reserva, ej. "CNS-7F3K2QA". */
export function generateReference(): string {
  const bytes = randomBytes(LENGTH);
  let body = "";
  for (let i = 0; i < LENGTH; i++) body += ALPHABET[bytes[i] % ALPHABET.length];
  return `${REFERENCE_PREFIX}-${body}`;
}

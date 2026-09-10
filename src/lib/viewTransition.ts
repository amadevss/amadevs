/**
 * Envuelve document.startViewTransition de forma segura:
 * - Degrada si el navegador no lo soporta o el usuario pidió menos movimiento.
 * - Silencia el rechazo de `ready`/`finished` (p. ej. "InvalidStateError" cuando
 *   la pestaña no está visible o hay otra transición en curso).
 */
export function safeViewTransition(update: () => void, onFinish?: () => void) {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (typeof document === "undefined" || !document.startViewTransition || prefersReduced) {
    update();
    onFinish?.();
    return;
  }

  try {
    const transition = document.startViewTransition(() => update());
    transition.ready.catch(() => {});
    transition.finished.catch(() => {}).finally(() => onFinish?.());
  } catch {
    update();
    onFinish?.();
  }
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import Icon from "./icons";

/* ───────────── Tipos ───────────── */

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; message: string };

type ConfirmOptions = {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type PromptOptions = ConfirmOptions & {
  label: string;
  defaultValue?: string;
  validate?: (value: string) => string | null;
};

type DialogState =
  | { kind: "confirm"; opts: ConfirmOptions; resolve: (ok: boolean) => void }
  | { kind: "prompt"; opts: PromptOptions; resolve: (value: string | null) => void };

type FeedbackApi = {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  prompt: (opts: PromptOptions) => Promise<string | null>;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}

/* ───────────── Proveedor ───────────── */

/**
 * Avisos (toasts) y ventanas de confirmación propias, en lugar de
 * alert/confirm/prompt del navegador.
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
    },
    [dismiss],
  );

  const api = useMemo<FeedbackApi>(
    () => ({
      toast: {
        success: (m) => push("success", m),
        error: (m) => push("error", m),
        info: (m) => push("info", m),
      },
      confirm: (opts) => new Promise((resolve) => setDialog({ kind: "confirm", opts, resolve })),
      prompt: (opts) => new Promise((resolve) => setDialog({ kind: "prompt", opts, resolve })),
    }),
    [push],
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
      {dialog ? (
        <Dialog
          key={dialog.opts.title}
          state={dialog}
          onClose={(value) => {
            if (dialog.kind === "confirm") dialog.resolve(value === true);
            else dialog.resolve(typeof value === "string" ? value : null);
            setDialog(null);
          }}
        />
      ) : null}
    </FeedbackContext.Provider>
  );
}

/* ───────────── Toasts ───────────── */

const TOAST_STYLE: Record<ToastTone, { icon: "check" | "alert" | "info"; cls: string }> = {
  success: { icon: "check", cls: "text-emerald-600 bg-emerald-500/12 dark:text-emerald-400" },
  error: { icon: "alert", cls: "text-rose-600 bg-rose-500/12 dark:text-rose-400" },
  info: { icon: "info", cls: "text-primary-ink bg-primary-soft" },
};

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
    >
      {toasts.map((t) => {
        const st = TOAST_STYLE[t.tone];
        return (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border-strong bg-surface p-3 shadow-[var(--shadow-lg)]"
            style={{ backgroundColor: "var(--bg)" }}
          >
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${st.cls}`}>
              <Icon name={st.icon} className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 py-1 text-sm font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              className="-m-1 grid grid-cols-1 h-8 w-8 shrink-0 place-items-center rounded-full text-subtle transition hover:bg-surface-2 hover:text-fg"
              aria-label="Cerrar aviso"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Ventana de confirmación / entrada ───────────── */

function Dialog({ state, onClose }: { state: DialogState; onClose: (value: boolean | string | null) => void }) {
  const { opts } = state;
  const isPrompt = state.kind === "prompt";
  const [value, setValue] = useState(isPrompt ? (state.opts.defaultValue ?? "") : "");
  const [error, setError] = useState<string | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (isPrompt ? inputRef.current : confirmRef.current)?.focus();
    inputRef.current?.select();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(isPrompt ? null : false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!isPrompt) return onClose(true);
    const v = value.trim();
    const err = state.opts.validate?.(v) ?? (v ? null : "Escribe un valor");
    if (err) return setError(err);
    onClose(v);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Cerrar"
        className="dialog-backdrop absolute inset-0 bg-black/45"
        onClick={() => onClose(isPrompt ? null : false)}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="ui-dialog-title"
        onSubmit={submit}
        className="dialog-in relative w-full max-w-md rounded-t-3xl border border-border-strong p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)] sm:rounded-3xl sm:p-6"
        style={{ backgroundColor: "var(--bg)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              opts.danger ? "bg-rose-500/12 text-rose-600 dark:text-rose-400" : "bg-primary-soft text-primary-ink"
            }`}
          >
            <Icon name={opts.danger ? "alert" : isPrompt ? "lock" : "info"} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            <h2 id="ui-dialog-title" className="font-display text-lg font-bold leading-snug">
              {opts.title}
            </h2>
            {opts.message ? <div className="mt-1.5 text-sm text-muted">{opts.message}</div> : null}
          </div>
        </div>

        {isPrompt ? (
          <label className="mt-4 block">
            <span className="text-xs font-semibold uppercase tracking-wide text-subtle">{state.opts.label}</span>
            <input
              ref={inputRef}
              className="agenda-input mt-1 min-h-11 font-mono"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
            />
            {error ? <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">{error}</span> : null}
          </label>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost min-h-11"
            onClick={() => onClose(isPrompt ? null : false)}
          >
            {opts.cancelLabel ?? "Cancelar"}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            className={`btn min-h-11 ${opts.danger ? "btn-danger" : "btn-primary"}`}
          >
            {opts.confirmLabel ?? "Aceptar"}
          </button>
        </div>
      </form>
    </div>
  );
}

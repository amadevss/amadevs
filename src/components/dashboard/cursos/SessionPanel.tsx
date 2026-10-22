"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AttendanceRow,
  AttendanceStatus,
  CourseMaterial,
  CourseSubmission,
  SessionWithMaterials,
} from "@/lib/cursos/queries";
import { ATTENDANCE_LABEL, ATTENDANCE_TONE, formatDateTime } from "@/lib/cursos/shared";
import { uploadCourseFile } from "@/lib/cursos/upload";
import FileList from "@/components/cursos/FileList";

/** Asistencia, materiales (subir/quitar) y entregas (ver/calificar/borrar) de una sesión. */
export default function SessionPanel({
  session,
  onMaterialsChange,
}: {
  session: SessionWithMaterials;
  onMaterialsChange: (materials: CourseMaterial[]) => void;
}) {
  return (
    <div className="grid gap-5">
      <Attendance sessionId={session.id} />
      <Materials session={session} onChange={onMaterialsChange} />
      {session.accepts_submissions || session.submission_count > 0 ? <Submissions sessionId={session.id} /> : null}
    </div>
  );
}

function Materials({
  session,
  onChange,
}: {
  session: SessionWithMaterials;
  onChange: (materials: CourseMaterial[]) => void;
}) {
  const [uploading, setUploading] = useState<{ name: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setError(null);
    const added: CourseMaterial[] = [];
    try {
      for (const file of Array.from(list)) {
        setUploading({ name: file.name, pct: 0 });
        const up = await uploadCourseFile(file, "material", session.id, (pct) =>
          setUploading({ name: file.name, pct }),
        );
        const r = await fetch(`/api/dashboard/cursos/sesiones/${session.id}/materiales`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(up),
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo registrar el material");
        added.push(j.material as CourseMaterial);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (added.length) onChange([...session.materials, ...added]);
      setUploading(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!window.confirm("¿Quitar este material?")) return;
    const r = await fetch(`/api/dashboard/cursos/materiales/${id}`, { method: "DELETE" });
    if (!r.ok) return window.alert("No se pudo quitar el material");
    onChange(session.materials.filter((m) => m.id !== id));
  }

  return (
    <section className="surface-card grid gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold">Materiales ({session.materials.length})</h3>
        <label className={`btn btn-ghost min-h-11 w-full cursor-pointer sm:w-auto ${uploading ? "pointer-events-none opacity-60" : ""}`}>
          {uploading ? `Subiendo ${uploading.name} · ${Math.round(uploading.pct)}%` : "+ Subir archivos"}
          <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
        </label>
      </div>
      {error ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
      {session.materials.length === 0 ? (
        <p className="text-sm text-subtle">Sin materiales. Sube PDFs, imágenes, presentaciones, videos…</p>
      ) : (
        <FileList files={session.materials} onDelete={remove} />
      )}
    </section>
  );
}

function Submissions({ sessionId }: { sessionId: string }) {
  const [subs, setSubs] = useState<CourseSubmission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/entregas`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudieron cargar las entregas");
      setSubs(j.submissions as CourseSubmission[]);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    setSubs(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function remove(id: string) {
    if (!window.confirm("¿Eliminar esta entrega y sus archivos? No se puede deshacer.")) return;
    const r = await fetch(`/api/dashboard/cursos/entregas/${id}`, { method: "DELETE" });
    if (!r.ok) return window.alert("No se pudo eliminar la entrega");
    setSubs((prev) => prev?.filter((s) => s.id !== id) ?? null);
  }

  return (
    <section className="surface-card grid gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold">Entregas {subs ? `(${subs.length})` : ""}</h3>
        <button type="button" className="text-sm text-muted transition hover:text-fg" onClick={load}>
          Actualizar
        </button>
      </div>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {!subs ? (
        <p className="text-sm text-subtle">Cargando…</p>
      ) : subs.length === 0 ? (
        <p className="text-sm text-subtle">Nadie ha entregado todavía.</p>
      ) : (
        <ul className="grid gap-4">
          {subs.map((s) => (
            <SubmissionItem key={s.id} sub={s} onDelete={() => remove(s.id)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SubmissionItem({ sub, onDelete }: { sub: CourseSubmission; onDelete: () => void }) {
  const [grade, setGrade] = useState(sub.grade ?? "");
  const [feedback, setFeedback] = useState(sub.feedback ?? "");
  const [saved, setSaved] = useState<"idle" | "saving" | "ok">("idle");

  async function save() {
    setSaved("saving");
    const r = await fetch(`/api/dashboard/cursos/entregas/${sub.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grade, feedback }),
    });
    if (!r.ok) {
      setSaved("idle");
      return window.alert("No se pudo guardar la calificación");
    }
    setSaved("ok");
  }

  return (
    <li className="grid gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="min-w-0">
          <span className="block font-semibold">{sub.student_name}</span>
          {sub.student_email ? <span className="block break-all text-xs text-subtle">{sub.student_email}</span> : null}
        </span>
        <span className="text-xs text-subtle">{formatDateTime(sub.updated_at)}</span>
      </div>
      {sub.comment ? <p className="whitespace-pre-line text-sm text-muted">{sub.comment}</p> : null}
      <FileList files={sub.files} />
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Calificación</span>
          <input
            className="agenda-input mt-1"
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value);
              setSaved("idle");
            }}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Comentario</span>
          <input
            className="agenda-input mt-1"
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setSaved("idle");
            }}
          />
        </label>
        <div className="flex items-center gap-3">
          <button type="button" className="btn btn-ghost min-h-10" onClick={save} disabled={saved === "saving"}>
            {saved === "saving" ? "Guardando…" : saved === "ok" ? "Guardado ✓" : "Guardar"}
          </button>
          <button
            type="button"
            className="min-h-10 px-2 text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
            onClick={onDelete}
          >
            Eliminar
          </button>
        </div>
      </div>
    </li>
  );
}

const STATUS_ORDER: AttendanceStatus[] = ["presente", "retardo", "falta", "justificada"];

/** Pase de lista: un toque por alumno; tocar el estado activo lo quita. */
function Attendance({ sessionId }: { sessionId: string }) {
  const [rows, setRows] = useState<AttendanceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/cursos/sesiones/${sessionId}/asistencia`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || "No se pudo cargar la asistencia");
        setRows(j.rows as AttendanceRow[]);
      })
      .catch((err: Error) => setError(err.message));
  }, [sessionId]);

  async function mark(studentId: string, status: AttendanceStatus | null) {
    const before = rows;
    setRows((prev) => prev?.map((r) => (r.student_id === studentId ? { ...r, status } : r)) ?? null);
    const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/asistencia`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ studentId, status }),
    });
    if (!r.ok) {
      setRows(before);
      window.alert("No se pudo guardar la asistencia");
    }
  }

  async function allPresent() {
    setBusy(true);
    const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/asistencia`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return window.alert(j.error || "No se pudo guardar la asistencia");
    setRows(j.rows as AttendanceRow[]);
  }

  const pending = rows?.filter((r) => !r.status).length ?? 0;

  return (
    <section className="surface-card grid gap-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-bold">
          Asistencia {rows ? `(${rows.length - pending}/${rows.length})` : ""}
        </h3>
        {rows && pending > 0 ? (
          <button type="button" className="btn btn-ghost min-h-10 w-full sm:w-auto" onClick={allPresent} disabled={busy}>
            {busy ? "Guardando…" : `Marcar ${pending} sin registro como presentes`}
          </button>
        ) : null}
      </div>
      {error ? <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
      {!rows ? (
        <p className="text-sm text-subtle">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-subtle">Aún no hay alumnos inscritos en este curso.</p>
      ) : (
        <ul className="grid gap-3">
          {rows.map((r) => (
            <li key={r.student_id} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
              <span className="min-w-0 truncate text-sm font-medium">{r.full_name}</span>
              <div className="grid grid-cols-4 gap-1">
                {STATUS_ORDER.map((st) => (
                  <button
                    key={st}
                    type="button"
                    aria-pressed={r.status === st}
                    onClick={() => mark(r.student_id, r.status === st ? null : st)}
                    className={`min-h-10 rounded-lg border px-2 text-xs font-semibold transition ${
                      r.status === st ? ATTENDANCE_TONE[st] : "border-border text-subtle hover:bg-surface-2"
                    }`}
                  >
                    {ATTENDANCE_LABEL[st]}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import type { CourseMaterial } from "@/lib/cursos/queries";
import { formatBytes, MAX_MATERIAL_BYTES } from "@/lib/cursos/shared";
import { uploadCourseFile } from "@/lib/cursos/upload";
import { useFeedback } from "@/components/ui/feedback";
import Icon from "@/components/ui/icons";
import FileList from "@/components/cursos/FileList";

type Upload = { key: string; name: string; size: number; pct: number; error?: string };

export default function MaterialsPanel({ sessionId, materials }: { sessionId: string; materials: CourseMaterial[] }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const [, startRefresh] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = uploads.some((u) => !u.error && u.pct < 100);

  const patch = (key: string, p: Partial<Upload>) =>
    setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, ...p } : u)));

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (files.length === 0) return;

    const batch = files.map((f, i) => ({ file: f, key: `${Date.now()}-${i}-${f.name}` }));
    setUploads((prev) => [
      ...prev.filter((u) => u.error),
      ...batch.map(({ file, key }) => ({
        key,
        name: file.name,
        size: file.size,
        pct: 0,
        error: file.size > MAX_MATERIAL_BYTES ? `Pesa más de ${formatBytes(MAX_MATERIAL_BYTES)}` : undefined,
      })),
    ]);

    let ok = 0;
    for (const { file, key } of batch) {
      if (file.size > MAX_MATERIAL_BYTES) continue;
      try {
        const up = await uploadCourseFile(file, "material", sessionId, (pct) => patch(key, { pct: Math.min(pct, 99) }));
        const r = await fetch(`/api/dashboard/cursos/sesiones/${sessionId}/materiales`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(up),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || "No se pudo registrar");
        patch(key, { pct: 100 });
        ok++;
      } catch (err) {
        patch(key, { error: (err as Error).message || "Falló la subida" });
      }
    }

    if (ok > 0) {
      toast.success(ok === 1 ? "Material subido" : `${ok} materiales subidos`);
      startRefresh(() => router.refresh());
      // Quita de la lista de progreso los que ya terminaron bien.
      setUploads((prev) => prev.filter((u) => u.error));
    }
    if (ok < batch.length) toast.error("Algunos archivos no se pudieron subir");
  }

  async function remove(id: string) {
    const m = materials.find((x) => x.id === id);
    const yes = await confirm({
      title: "¿Quitar este material?",
      message: m ? `"${m.filename}" dejará de estar disponible para los alumnos.` : undefined,
      confirmLabel: "Quitar",
      danger: true,
    });
    if (!yes) return;
    const r = await fetch(`/api/dashboard/cursos/materiales/${id}`, { method: "DELETE" });
    if (!r.ok) return toast.error("No se pudo quitar el material");
    toast.success("Material quitado");
    startRefresh(() => router.refresh());
  }

  return (
    <div className="grid gap-4">
      <label
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragging ? "border-primary bg-primary-soft" : "border-border-strong bg-surface hover:border-primary/60"
        } ${busy ? "pointer-events-none opacity-60" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <span className="grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
          <Icon name="upload" className="h-6 w-6" />
        </span>
        <span className="font-medium">
          {busy ? "Subiendo…" : (
            <>
              <span className="hidden sm:inline">Arrastra archivos aquí o </span>
              <span className="text-primary-ink">elige archivos</span>
            </>
          )}
        </span>
        <span className="text-xs text-subtle">PDF, presentaciones, imágenes, videos… hasta {formatBytes(MAX_MATERIAL_BYTES)} c/u</span>
        <input ref={inputRef} type="file" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
      </label>

      {uploads.length > 0 ? (
        <ul className="grid gap-2" aria-live="polite">
          {uploads.map((u) => (
            <li key={u.key} className="surface-card grid gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{u.name}</span>
                <span className={`shrink-0 text-xs ${u.error ? "text-rose-600 dark:text-rose-400" : "text-subtle"}`}>
                  {u.error ?? `${Math.round(u.pct)}% · ${formatBytes(u.size)}`}
                </span>
              </div>
              {!u.error ? (
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full transition-[width]" style={{ width: `${u.pct}%`, background: "var(--grad)" }} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {materials.length === 0 ? (
        <p className="text-center text-sm text-subtle">Aún no hay materiales en esta sesión.</p>
      ) : (
        <section className="grid gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-subtle">
            {materials.length} {materials.length === 1 ? "archivo" : "archivos"} visibles para los alumnos
          </h2>
          <FileList files={materials} onDelete={remove} />
        </section>
      )}
    </div>
  );
}

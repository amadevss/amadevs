"use client";

import { useState, type FormEvent } from "react";
import type { BlogPost } from "@/lib/blog/posts";

export default function BlogAdminForm({
  onCreated,
  onCancel,
}: {
  onCreated: (post: BlogPost) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim().length > 1 && content.trim().length > 1;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/dashboard/blog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, slug, description, tags, content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo crear el post");
      onCreated(j.post as BlogPost);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card grid gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Nuevo post</h2>
        <button type="button" onClick={onCancel} className="text-sm text-muted transition hover:text-fg">
          Cerrar
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Título *</span>
          <input className="agenda-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Slug (opcional, se genera del título)
          </span>
          <input
            className="agenda-input mt-1"
            placeholder="mi-post"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Descripción</span>
          <input
            className="agenda-input mt-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Tags (separados por coma)
          </span>
          <input
            className="agenda-input mt-1"
            placeholder="Personal, Reflexión"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Contenido (Markdown) *
          </span>
          <textarea
            className="agenda-textarea mt-1 min-h-60 font-mono text-sm"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={!valid || submitting}>
        {submitting ? "Publicando…" : "Publicar post"}
      </button>
    </form>
  );
}

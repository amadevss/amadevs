"use client";

import { useState, type FormEvent } from "react";
import type { BlogPost } from "@/lib/blog/posts";
import { ErrorNote } from "@/components/ui/kit";

export default function BlogAdminForm({
  post,
  onSaved,
  onCancel,
}: {
  post?: BlogPost;
  onSaved: (post: BlogPost) => void;
  onCancel: () => void;
}) {
  const editing = !!post;
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [description, setDescription] = useState(post?.description ?? "");
  const [tags, setTags] = useState(post?.tags.join(", ") ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim().length > 1 && content.trim().length > 1;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch(editing ? `/api/dashboard/blog/${post.id}` : "/api/dashboard/blog", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, slug, description, tags, content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo guardar el post");
      onSaved(j.post as BlogPost);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface-card grid gap-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Título *</span>
          <input className="agenda-input mt-1 min-h-11" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Slug {editing ? "" : "(opcional, se genera del título)"}
          </span>
          <input
            className="agenda-input mt-1 min-h-11"
            placeholder="mi-post"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">Descripción</span>
          <input
            className="agenda-input mt-1 min-h-11"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            Tags (separados por coma)
          </span>
          <input
            className="agenda-input mt-1 min-h-11"
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

      {error ? <ErrorNote>{error}</ErrorNote> : null}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} className="btn btn-ghost min-h-11" disabled={submitting}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary min-h-11" disabled={!valid || submitting}>
          {submitting ? "Guardando…" : editing ? "Guardar cambios" : "Publicar post"}
        </button>
      </div>
    </form>
  );
}

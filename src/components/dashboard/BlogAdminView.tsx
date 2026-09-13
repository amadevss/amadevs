"use client";

import { useState } from "react";
import type { BlogPost } from "@/lib/blog/posts";
import BlogAdminForm from "./BlogAdminForm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogAdminView({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleHidden(post: BlogPost) {
    setBusyId(post.id);
    try {
      const r = await fetch(`/api/dashboard/blog/${post.id}/hidden`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hidden: !post.hidden }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo actualizar el post");
      setPosts((prev) => prev.map((p) => (p.id === post.id ? (j.post as BlogPost) : p)));
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(post: BlogPost) {
    if (!window.confirm(`¿Eliminar "${post.title}" para siempre? Esta acción no se puede deshacer.`)) return;
    setBusyId(post.id);
    try {
      const r = await fetch(`/api/dashboard/blog/${post.id}`, { method: "DELETE" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "No se pudo eliminar el post");
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-end">
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cerrar formulario" : "+ Nuevo post"}
        </button>
      </div>

      {showForm ? (
        <BlogAdminForm
          onCancel={() => setShowForm(false)}
          onCreated={(post) => {
            setPosts((prev) => [post, ...prev]);
            setShowForm(false);
          }}
        />
      ) : null}

      <div className="surface-card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-subtle">
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-subtle">
                  Sin posts todavía.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{post.title}</div>
                    <div className="text-xs text-subtle">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        post.hidden
                          ? "border-border bg-surface-2 text-subtle"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {post.hidden ? "Oculto" : "Publicado"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        className="text-xs font-medium text-muted transition hover:text-fg disabled:opacity-40"
                        disabled={busyId === post.id}
                        onClick={() => toggleHidden(post)}
                      >
                        {post.hidden ? "Mostrar" : "Ocultar"}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-rose-600 transition hover:underline disabled:opacity-40 dark:text-rose-400"
                        disabled={busyId === post.id}
                        onClick={() => remove(post)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { BlogPost } from "@/lib/blog/posts";
import { useFeedback } from "@/components/ui/feedback";
import { ButtonLink, EmptyState, VisibilityBadge } from "@/components/ui/kit";
import Icon from "@/components/ui/icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" });
}

const actionCls =
  "inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface-2 hover:text-fg disabled:opacity-40";

export default function BlogAdminView({ posts }: { posts: BlogPost[] }) {
  const router = useRouter();
  const { toast, confirm } = useFeedback();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startRefresh] = useTransition();

  async function run(post: BlogPost, fn: () => Promise<Response>, success: string) {
    setBusyId(post.id);
    try {
      const r = await fn();
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "No se pudo actualizar el post");
      toast.success(success);
      startRefresh(() => router.refresh());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleHidden(post: BlogPost) {
    await run(
      post,
      () =>
        fetch(`/api/dashboard/blog/${post.id}/hidden`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hidden: !post.hidden }),
        }),
      post.hidden ? "Post publicado" : "Post oculto",
    );
  }

  async function remove(post: BlogPost) {
    const ok = await confirm({
      title: `¿Eliminar "${post.title}"?`,
      message: "Se borra para siempre. Si solo quieres quitarlo del blog, usa Ocultar.",
      confirmLabel: "Eliminar post",
      danger: true,
    });
    if (!ok) return;
    await run(post, () => fetch(`/api/dashboard/blog/${post.id}`, { method: "DELETE" }), "Post eliminado");
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon="pen"
        title="Sin posts todavía"
        action={
          <ButtonLink href="/dashboard/blog/nuevo" icon="plus">
            Escribir el primero
          </ButtonLink>
        }
      >
        Escribe en Markdown y publícalo en el blog.
      </EmptyState>
    );
  }

  return (
    <ul className="surface-card divide-y divide-border overflow-hidden">
      {posts.map((post) => (
        <li key={post.id} className="grid grid-cols-1 gap-2 p-4 sm:flex sm:items-center sm:gap-4">
          <Link href={`/dashboard/blog/${post.id}`} className="group min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-semibold group-hover:text-primary-ink">{post.title}</span>
              <VisibilityBadge hidden={post.hidden} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-subtle">
              {formatDate(post.published_at)} · /blog/{post.slug}
            </span>
          </Link>
          <div className="-ml-2.5 flex shrink-0 flex-wrap items-center sm:ml-0">
            <Link href={`/dashboard/blog/${post.id}`} className={actionCls}>
              <Icon name="edit" className="h-4 w-4" /> Editar
            </Link>
            {!post.hidden ? (
              <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className={actionCls}>
                <Icon name="external" className="h-4 w-4" /> Ver
              </a>
            ) : null}
            <button type="button" className={actionCls} disabled={busyId === post.id} onClick={() => toggleHidden(post)}>
              <Icon name={post.hidden ? "eye" : "eyeOff"} className="h-4 w-4" />
              {post.hidden ? "Publicar" : "Ocultar"}
            </button>
            <button
              type="button"
              className={`${actionCls} text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400`}
              disabled={busyId === post.id}
              onClick={() => remove(post)}
            >
              <Icon name="trash" className="h-4 w-4" /> Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

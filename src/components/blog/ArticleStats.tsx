"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

function likeStorageKey(slug: string) {
  return `blog-like:${slug}`;
}

export default function ArticleStats() {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";

  const [views, setViews] = useState<number | null>(null);
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLiked(window.localStorage.getItem(likeStorageKey(slug)) === "1");

    fetch(`/api/blog/${slug}/view`, { method: "POST" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setViews(data.views);
        setLikes(data.likes);
      })
      .catch(() => {});
  }, [slug]);

  async function toggleLike() {
    if (!slug || pending) return;
    const nextLiked = !liked;
    setPending(true);
    setLiked(nextLiked);
    setLikes((current) => (current ?? 0) + (nextLiked ? 1 : -1));

    try {
      const r = await fetch(`/api/blog/${slug}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: nextLiked }),
      });
      if (!r.ok) throw new Error("request failed");
      const data = await r.json();
      setLikes(data.likes);
      window.localStorage.setItem(likeStorageKey(slug), nextLiked ? "1" : "0");
    } catch {
      setLiked(!nextLiked);
      setLikes((current) => (current ?? 0) + (nextLiked ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8 flex items-center gap-4 border-t border-border pt-6 text-sm text-subtle">
      <button
        type="button"
        onClick={toggleLike}
        disabled={pending}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
          liked
            ? "border-primary bg-primary-soft text-primary-ink"
            : "border-border bg-surface-2 hover:text-primary-ink"
        }`}
      >
        <svg
          className="h-4 w-4"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 21l-7.682-8.318a4.5 4.5 0 010-6.364z"
          />
        </svg>
        {likes ?? "—"}
      </button>

      <span className="inline-flex items-center gap-1.5">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        {views ?? "—"} vistas
      </span>
    </div>
  );
}

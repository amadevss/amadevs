import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { mdxComponents } from "@/components/blog/MdxComponents";

/** Markdown de cursos con el mismo estilo que los artículos del blog. */
export default function Markdown({ source }: { source: string }) {
  if (!source.trim()) return null;
  return (
    <div
      className="prose prose-slate max-w-none dark:prose-invert
        prose-headings:font-display prose-headings:tracking-tight
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
        prose-h3:text-base prose-h3:mt-6
        prose-a:text-primary-ink prose-a:no-underline hover:prose-a:underline
        prose-code:before:content-none prose-code:after:content-none
        prose-code:bg-surface-2 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[0.85em] prose-code:font-mono
        prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl
        prose-blockquote:border-primary prose-blockquote:bg-primary-soft prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic
        prose-strong:text-fg prose-li:marker:text-primary prose-hr:border-border prose-table:text-sm"
    >
      {/* format "md": markdown puro, así un "<" o "{" no rompe la página. */}
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{ mdxOptions: { format: "md", remarkPlugins: [remarkGfm] } }}
      />
    </div>
  );
}

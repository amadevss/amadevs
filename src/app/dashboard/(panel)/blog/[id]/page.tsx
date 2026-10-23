import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireDashboard } from "@/lib/dashboard/auth";
import { getBlogPostById } from "@/lib/blog/posts";
import { ButtonLink, PageHeader, VisibilityBadge } from "@/components/ui/kit";
import BlogEditorClient from "@/components/dashboard/BlogEditorClient";

export const metadata: Metadata = { title: "Editar post" };
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function EditarPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireDashboard(`/dashboard/blog/${id}`);
  const post = UUID_RE.test(id) ? await getBlogPostById(id) : null;
  if (!post) notFound();
  return (
    <>
      <PageHeader
        title={post.title}
        badge={<VisibilityBadge hidden={post.hidden} />}
        crumbs={[{ label: "Blog", href: "/dashboard/blog" }, { label: "Editar" }]}
        actions={
          post.hidden ? null : (
            <ButtonLink href={`/blog/${post.slug}`} variant="ghost" icon="external" external>
              Ver post
            </ButtonLink>
          )
        }
      />
      <BlogEditorClient key={post.id} post={post} />
    </>
  );
}

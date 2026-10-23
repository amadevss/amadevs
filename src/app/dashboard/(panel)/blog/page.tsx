import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { listAllBlogPostsForDashboard } from "@/lib/blog/posts";
import { ButtonLink, PageHeader } from "@/components/ui/kit";
import BlogAdminView from "@/components/dashboard/BlogAdminView";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

export default async function BlogAdminPage() {
  await requireDashboard();
  const posts = await listAllBlogPostsForDashboard();
  const visible = posts.filter((p) => !p.hidden).length;
  return (
    <>
      <PageHeader
        title="Blog"
        description={`${visible} publicados · ${posts.length - visible} ocultos`}
        actions={
          <ButtonLink href="/dashboard/blog/nuevo" icon="plus">
            Nuevo post
          </ButtonLink>
        }
      />
      <BlogAdminView posts={posts} />
    </>
  );
}

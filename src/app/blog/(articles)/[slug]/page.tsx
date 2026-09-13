import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getVisibleBlogPostBySlug } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getVisibleBlogPostBySlug(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getVisibleBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <h1>{post.title}</h1>
      <MDXRemote source={post.content} />
    </>
  );
}

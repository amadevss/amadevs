import { sql } from "@/lib/db";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  read_time: number;
  published_at: string;
  hidden: boolean;
  created_at: string;
  updated_at: string;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export async function listVisibleBlogPosts(): Promise<BlogPost[]> {
  const { rows } = await sql<BlogPost>`
    select * from blog_post where not hidden order by published_at desc, created_at desc`;
  return rows;
}

export async function listAllBlogPostsForDashboard(): Promise<BlogPost[]> {
  const { rows } = await sql<BlogPost>`
    select * from blog_post order by published_at desc, created_at desc`;
  return rows;
}

export async function getVisibleBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { rows } = await sql<BlogPost>`
    select * from blog_post where slug = ${slug} and not hidden limit 1`;
  return rows[0] ?? null;
}

export async function createBlogPost(input: {
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}): Promise<BlogPost> {
  const readTime = estimateReadTime(input.content);
  const { rows } = await sql.query<BlogPost>(
    `insert into blog_post (slug, title, description, content, tags, read_time)
     values ($1, $2, $3, $4, $5, $6)
     returning *`,
    [input.slug, input.title, input.description, input.content, input.tags, readTime],
  );
  return rows[0];
}

export async function setBlogPostHidden(id: string, hidden: boolean): Promise<BlogPost | null> {
  const { rows } = await sql<BlogPost>`
    update blog_post set hidden = ${hidden} where id = ${id} returning *`;
  return rows[0] ?? null;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const { rowCount } = await sql`delete from blog_post where id = ${id}`;
  return (rowCount ?? 0) > 0;
}

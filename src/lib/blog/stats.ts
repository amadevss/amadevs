import { sql } from "@/lib/db";

export type BlogPostStat = {
  slug: string;
  views: number;
  likes: number;
};

export async function getAllBlogStats(): Promise<Record<string, BlogPostStat>> {
  const { rows } = await sql<BlogPostStat>`select slug, views, likes from blog_post_stat`;
  return Object.fromEntries(rows.map((row) => [row.slug, row]));
}

export async function incrementView(slug: string): Promise<BlogPostStat> {
  const { rows } = await sql<BlogPostStat>`
    insert into blog_post_stat (slug, views, likes) values (${slug}, 1, 0)
    on conflict (slug) do update
      set views = blog_post_stat.views + 1, updated_at = now()
    returning slug, views, likes`;
  return rows[0];
}

export async function setLike(slug: string, liked: boolean): Promise<BlogPostStat> {
  const delta = liked ? 1 : -1;
  const { rows } = await sql<BlogPostStat>`
    insert into blog_post_stat (slug, views, likes) values (${slug}, 0, greatest(${delta}, 0))
    on conflict (slug) do update
      set likes = greatest(blog_post_stat.likes + ${delta}, 0), updated_at = now()
    returning slug, views, likes`;
  return rows[0];
}

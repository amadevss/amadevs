import type { Metadata } from "next";
import { requireDashboard } from "@/lib/dashboard/auth";
import { PageHeader } from "@/components/ui/kit";
import BlogEditorClient from "@/components/dashboard/BlogEditorClient";

export const metadata: Metadata = { title: "Nuevo post" };
export const dynamic = "force-dynamic";

export default async function NuevoPostPage() {
  await requireDashboard("/dashboard/blog/nuevo");
  return (
    <>
      <PageHeader title="Nuevo post" crumbs={[{ label: "Blog", href: "/dashboard/blog" }, { label: "Nuevo" }]} />
      <BlogEditorClient />
    </>
  );
}

"use client";

import { useRouter } from "next/navigation";
import type { BlogPost } from "@/lib/blog/posts";
import { useFeedback } from "@/components/ui/feedback";
import BlogAdminForm from "./BlogAdminForm";

export default function BlogEditorClient({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { toast } = useFeedback();
  return (
    <BlogAdminForm
      post={post}
      onCancel={() => router.push("/dashboard/blog")}
      onSaved={(saved) => {
        toast.success(post ? "Cambios guardados" : `"${saved.title}" publicado`);
        router.push("/dashboard/blog");
        router.refresh();
      }}
    />
  );
}

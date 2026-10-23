import type { Metadata } from "next";
import AuthPage from "@/components/cursos/AuthPage";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ curso?: string }> }) {
  const { curso } = await searchParams;
  return <AuthPage mode="entrar" curso={curso} />;
}

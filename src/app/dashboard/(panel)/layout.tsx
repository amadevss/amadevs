import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireDashboard } from "@/lib/dashboard/auth";
import { FeedbackProvider } from "@/components/ui/feedback";
import DashboardShell from "@/components/dashboard/shell/DashboardShell";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Dashboard" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireDashboard();
  return (
    <FeedbackProvider>
      <DashboardShell>{children}</DashboardShell>
    </FeedbackProvider>
  );
}

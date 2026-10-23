"use client";

import { useRouter } from "next/navigation";
import type { Service } from "@/lib/agenda/types";
import { useFeedback } from "@/components/ui/feedback";
import ManualBookingForm, { type ManualBookingPrefill } from "./ManualBookingForm";

export default function NewBookingClient({
  services,
  prefill,
  backHref,
}: {
  services: Service[];
  prefill?: ManualBookingPrefill;
  backHref: string;
}) {
  const router = useRouter();
  const { toast } = useFeedback();
  return (
    <ManualBookingForm
      services={services}
      initial={prefill}
      onCancel={() => router.push(backHref)}
      onCreated={(b) => {
        toast.success(`Reserva creada para ${b.customer_name}`);
        router.push("/dashboard/reservas");
        router.refresh();
      }}
    />
  );
}

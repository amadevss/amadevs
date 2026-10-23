"use client";

import { useRouter } from "next/navigation";
import type { Blackout, BookingWithService, Service } from "@/lib/agenda/types";
import CalendarView from "./CalendarView";

export default function CalendarClient(props: {
  bookings: BookingWithService[];
  initialBlackouts: Blackout[];
  services: Service[];
  businessTimezone: string;
}) {
  const router = useRouter();
  return (
    <CalendarView
      {...props}
      onPickSlot={({ date, time, serviceSlug }) => {
        const q = new URLSearchParams({ desde: "calendario", fecha: date });
        if (time) q.set("hora", time);
        if (serviceSlug) q.set("servicio", serviceSlug);
        router.push(`/dashboard/reservas/nueva?${q}`);
      }}
    />
  );
}

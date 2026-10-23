import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReceiptView from "@/components/agenda/ReceiptView";
import { getBookingByReference } from "@/lib/agenda/queries";

export const metadata: Metadata = {
  title: "Comprobante de reserva",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ReciboPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { reference } = await params;
  const { s } = await searchParams;

  const booking = await getBookingByReference(reference.toUpperCase());
  if (!booking) notFound();

  return (
    <div className="py-12 sm:py-16">
      <ReceiptView booking={booking} justReturnedFromStripe={Boolean(s)} />
    </div>
  );
}

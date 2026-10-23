import { Skeleton } from "@/components/ui/kit";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-3" role="status" aria-label="Cargando">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

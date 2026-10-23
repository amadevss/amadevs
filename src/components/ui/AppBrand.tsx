import Link from "next/link";

/** Logo "BOP" + etiqueta del panel, para los shells de dashboard y cursos. */
export default function AppBrand({ href, label }: { href: string; label?: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold text-white"
        style={{ background: "var(--grad)" }}
      >
        BOP
      </span>
      {label ? <span className="truncate font-display text-[15px] font-semibold tracking-tight">{label}</span> : null}
    </Link>
  );
}

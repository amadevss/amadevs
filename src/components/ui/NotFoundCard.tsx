import Link from "next/link";

/** 404 dentro de un panel: sin header propio, el shell ya lo pone. */
export default function NotFoundCard({ href, label }: { href: string; label: string }) {
  return (
    <div className="mx-auto grid max-w-md place-content-center py-16 text-center sm:py-24">
      <p className="text-gradient font-display text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">No encontramos esto</h1>
      <p className="mt-2 text-sm text-muted">Puede que se haya borrado o que el enlace esté mal.</p>
      <div className="mt-6 flex justify-center">
        <Link
          href={href}
          className="inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold text-white"
          style={{ background: "var(--grad)" }}
        >
          {label}
        </Link>
      </div>
    </div>
  );
}

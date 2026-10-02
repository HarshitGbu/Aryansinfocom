import Link from "next/link";

export default function NotFound(): React.JSX.Element {
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 max-w-[65ch] text-text-muted">That page doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Go home
        </Link>
        <span className="rounded-[12px] border border-white/10 px-5 py-2.5 text-sm text-text-muted">
          Open search (⌘K)
        </span>
      </div>
    </main>
  );
}

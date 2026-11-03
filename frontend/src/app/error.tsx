"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong loading this page. Try again.</h1>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black active:scale-95"
      >
        Try again
      </button>
    </main>
  );
}

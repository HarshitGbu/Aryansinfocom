export function SkipLink(): React.JSX.Element {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[8px] focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-black"
    >
      Skip to content
    </a>
  );
}

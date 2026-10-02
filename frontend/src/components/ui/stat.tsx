export function Stat({ value, label }: { value: string; label: string }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-2xl font-medium text-text md:text-3xl">{value}</span>
      <span className="text-sm text-text-muted">{label}</span>
    </div>
  );
}

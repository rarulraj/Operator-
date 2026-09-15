export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-xl bg-ink-850/80" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="h-24 animate-pulse rounded-xl bg-ink-850/70" />
        <div className="h-24 animate-pulse rounded-xl bg-ink-850/70" />
        <div className="h-24 animate-pulse rounded-xl bg-ink-850/70" />
        <div className="h-24 animate-pulse rounded-xl bg-ink-850/70" />
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-ink-850/60" />
    </div>
  );
}

/** The box shown when hovering or tapping part of a chart. */
export function ChartTooltip({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-control border border-control bg-surface px-3 py-2 text-sm shadow-md">
      <p className="text-muted">{title}</p>
      <p className="font-semibold tabular-nums">{value}</p>
    </div>
  );
}

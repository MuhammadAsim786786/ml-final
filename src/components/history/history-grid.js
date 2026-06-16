import { HistoryCard } from "@/components/history/history-card";

export function HistoryGrid({ scans }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {scans.map((scan, i) => (
        <HistoryCard key={scan.id} scan={scan} index={i} />
      ))}
    </div>
  );
}

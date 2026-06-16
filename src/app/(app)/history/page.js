import { getUserPredictions } from "@/lib/data/predictions";
import { PageTransition } from "@/components/layout/page-transition";
import { HistoryGrid } from "@/components/history/history-grid";
import { HistoryEmpty } from "@/components/history/history-empty";

export const metadata = { title: "History — DermaScan" };

export default async function HistoryPage() {
  const scans = await getUserPredictions(100);

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Scan history</h1>
        <p className="text-sm text-muted-foreground">
          {scans.length > 0
            ? `${scans.length} scan${scans.length === 1 ? "" : "s"} saved to your account.`
            : "Your past analyses will appear here."}
        </p>
      </div>

      {scans.length === 0 ? <HistoryEmpty /> : <HistoryGrid scans={scans} />}
    </PageTransition>
  );
}

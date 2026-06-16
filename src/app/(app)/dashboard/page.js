import Link from "next/link";
import { ScanLine, Layers, Gauge, Activity, Plus } from "lucide-react";
import { getDashboardStats } from "@/lib/data/predictions";
import { PageTransition } from "@/components/layout/page-transition";
import { StatCard } from "@/components/dashboard/stat-card";
import { DiagnosisBarChart } from "@/components/dashboard/diagnosis-bar-chart";
import { ConfidenceTrendChart } from "@/components/dashboard/confidence-trend-chart";
import { RecentScans } from "@/components/dashboard/recent-scans";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard — DermaScan" };

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <PageTransition className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            An overview of your skin screening activity.
          </p>
        </div>
        <Link href="/detect" className={cn(buttonVariants())}>
          <Plus className="size-4" /> New scan
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Pass pre-rendered icon JSX — component functions (forwardRef objects) are
            not serialisable across the Server→Client boundary in React 19. */}
        <StatCard
          icon={<ScanLine className="size-5" />}
          label="Total scans"
          value={stats.total}
          delay={0}
        />
        <StatCard
          icon={<Gauge className="size-5" />}
          label="Avg. confidence"
          value={stats.avgConfidence * 100}
          decimals={0}
          suffix="%"
          accent="bg-chart-2/10 text-chart-2"
          delay={0.05}
        />
        <StatCard
          icon={<Activity className="size-5" />}
          label="Most common"
          value={stats.topDisease}
          accent="bg-chart-3/10 text-chart-3"
          delay={0.1}
        />
        <StatCard
          icon={<Layers className="size-5" />}
          label="Conditions seen"
          value={stats.byDisease.filter((d) => d.count > 0).length}
          accent="bg-chart-4/10 text-chart-4"
          delay={0.15}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DiagnosisBarChart data={stats.byDisease} />
        <ConfidenceTrendChart data={stats.trend} />
      </div>

      <RecentScans scans={stats.recent} />
    </PageTransition>
  );
}

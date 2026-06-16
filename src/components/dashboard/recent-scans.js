import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ImageOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDisease, SEVERITY_STYLES } from "@/lib/constants/diseases";
import { cn } from "@/lib/utils";

function timeAgo(date) {
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

export function RecentScans({ scans }) {
  return (
    <Card className="col-span-full">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent scans</CardTitle>
          <CardDescription>Your latest classifications</CardDescription>
        </div>
        <Link
          href="/history"
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {scans.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No scans yet. Head to{" "}
            <Link href="/detect" className="text-primary hover:underline">
              Detect
            </Link>{" "}
            to run your first.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {scans.map((scan) => {
              const disease = getDisease(scan.predicted_id);
              const sev = disease ? SEVERITY_STYLES[disease.severity] : null;
              return (
                <li key={scan.id} className="flex items-center gap-3 py-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {scan.imageUrl ? (
                      <Image
                        src={scan.imageUrl}
                        alt={scan.predicted_label}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-muted-foreground">
                        <ImageOff className="size-4" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {scan.predicted_label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(scan.created_at)}
                    </p>
                  </div>
                  {sev && (
                    <Badge variant="secondary" className={cn("font-normal", sev.badge)}>
                      {sev.label}
                    </Badge>
                  )}
                  <span className="w-12 text-right text-sm font-semibold tabular-nums">
                    {Math.round(Number(scan.confidence) * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

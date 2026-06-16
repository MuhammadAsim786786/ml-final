import Link from "next/link";
import { History as HistoryIcon, ScanLine } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HistoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
        <HistoryIcon className="size-7" />
      </span>
      <h3 className="mt-4 text-lg font-semibold">No scans yet</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Once you analyze an image, it will appear here with its result.
      </p>
      <Link href="/detect" className={cn(buttonVariants(), "mt-5")}>
        <ScanLine className="size-4" /> Run your first scan
      </Link>
    </div>
  );
}

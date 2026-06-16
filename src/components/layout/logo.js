import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

// App wordmark + icon. `size` controls the icon badge.
export function Logo({ className, showText = true, size = "md" }) {
  const dim = size === "sm" ? "size-7" : size === "lg" ? "size-11" : "size-9";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm",
          dim
        )}
      >
        <ScanLine className="size-1/2" />
      </span>
      {showText && (
        <span className="text-lg font-semibold tracking-tight">
          Derma<span className="text-primary">Scan</span>
        </span>
      )}
    </div>
  );
}

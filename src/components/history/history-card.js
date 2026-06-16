"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Trash2, ImageOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { deletePrediction } from "@/lib/actions/predictions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDisease, SEVERITY_STYLES } from "@/lib/constants/diseases";
import { cn } from "@/lib/utils";

export function HistoryCard({ scan, index = 0 }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const disease = getDisease(scan.predicted_id);
  const sev = disease ? SEVERITY_STYLES[disease.severity] : null;

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deletePrediction(scan.id);
      if (res?.error) {
        toast.error("Could not delete", { description: res.error });
        return;
      }
      setRemoved(true);
      toast.success("Scan deleted");
      router.refresh();
    });
  };

  if (removed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4) }}
    >
      <Card className="group overflow-hidden p-0">
        <div className="relative aspect-[4/3] w-full bg-muted">
          {scan.imageUrl ? (
            <Image
              src={scan.imageUrl}
              alt={scan.predicted_label}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <span className="grid h-full place-items-center text-muted-foreground">
              <ImageOff className="size-6" />
            </span>
          )}
          <Button
            size="icon"
            variant="secondary"
            onClick={handleDelete}
            disabled={pending}
            aria-label="Delete scan"
            className="absolute right-2 top-2 size-8 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4 text-destructive" />
            )}
          </Button>
        </div>
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium">{scan.predicted_label}</p>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {Math.round(Number(scan.confidence) * 100)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              {new Date(scan.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {sev && (
              <Badge variant="secondary" className={cn("font-normal", sev.badge)}>
                {sev.label}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

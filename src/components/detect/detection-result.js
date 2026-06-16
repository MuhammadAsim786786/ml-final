"use client";

import { motion } from "motion/react";
import { CheckCircle2, RotateCcw, Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getDisease, SEVERITY_STYLES } from "@/lib/constants/diseases";
import { cn } from "@/lib/utils";

export function DetectionResult({ result, onReset }) {
  const top = result.scores[0];
  const disease = getDisease(top.id);
  const sev = disease ? SEVERITY_STYLES[disease.severity] : null;
  const others = result.scores.slice(1, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 text-sm text-primary">
        <CheckCircle2 className="size-4" /> Analysis complete
        <Badge variant="secondary" className="ml-auto gap-1 font-normal">
          {result.source === "model" ? (
            <>
              <Sparkles className="size-3" /> Model
            </>
          ) : (
            <>
              <FlaskConical className="size-3" /> Demo
            </>
          )}
        </Badge>
      </div>

      {/* Top prediction */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Most likely
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight">
              {top.label}
            </h3>
            {disease && (
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {disease.blurb}
              </p>
            )}
          </div>
          {sev && (
            <Badge variant="secondary" className={cn("font-normal", sev.badge)}>
              {sev.label}
            </Badge>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Progress value={top.score * 100} className="h-2.5" />
          <span className="w-14 text-right text-lg font-semibold tabular-nums">
            {Math.round(top.score * 100)}%
          </span>
        </div>
      </div>

      {/* Alternatives */}
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          Other possibilities
        </p>
        <ul className="space-y-2.5">
          {others.map((s, i) => (
            <motion.li
              key={s.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="flex items-center gap-3"
            >
              <span className="w-36 shrink-0 truncate text-sm">{s.label}</span>
              <Progress value={s.score * 100} className="h-1.5" />
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round(s.score * 100)}%
              </span>
            </motion.li>
          ))}
        </ul>
      </div>

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-sm text-xs text-muted-foreground">
          AI estimate for educational use only — confirm any diagnosis with a
          qualified clinician.
        </p>
        <Button variant="outline" onClick={onReset}>
          <RotateCcw className="size-4" /> Scan another
        </Button>
      </div>
    </motion.div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, animate, useInView } from "motion/react";
import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function CountUp({ value, decimals = 0, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v.toFixed(decimals)),
    });
    return controls.stop;
  }, [inView, value, decimals, mv]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}

// `icon` must be already-rendered JSX (e.g. <ScanLine className="size-5" />)
// because this is a Client Component and Server Components cannot pass
// component functions (React.forwardRef objects) as props.
export function StatCard({ icon, label, value, decimals, suffix, accent, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="overflow-hidden">
        <CardContent className="flex items-center gap-4">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl",
              accent ?? "bg-primary/10 text-primary"
            )}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">
              {typeof value === "number" ? (
                <CountUp value={value} decimals={decimals} suffix={suffix} />
              ) : (
                value || "—"
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

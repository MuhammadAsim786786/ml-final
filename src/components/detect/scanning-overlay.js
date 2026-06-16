"use client";

import { motion } from "motion/react";

// Animated "analyzing" overlay drawn on top of the image preview while the
// server action runs. Pure CSS animations (scan-line / scan-grid in globals.css).
export function ScanningOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 overflow-hidden rounded-xl"
    >
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
      <div className="scan-grid absolute inset-0" />
      {/* Moving scan line */}
      <div className="scan-line absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-primary/40 to-transparent">
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary shadow-[0_0_12px_2px_var(--primary)]" />
      </div>
      <div className="absolute inset-0 grid place-items-center">
        <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-sm font-medium shadow-sm">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-primary"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </span>
          Analyzing image…
        </div>
      </div>
    </motion.div>
  );
}

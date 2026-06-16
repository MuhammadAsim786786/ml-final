"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { UploadCloud, ImageIcon, X, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { detectAndSave } from "@/lib/actions/predictions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScanningOverlay } from "@/components/detect/scanning-overlay";
import { DetectionResult } from "@/components/detect/detection-result";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024;
const MIN_SCAN_MS = 1700; // keep the animation on screen long enough to feel real

export function ImageUploader() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | ready | analyzing | done
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStatus("idle");
  }, [previewUrl]);

  const acceptFile = useCallback(
    (f) => {
      if (!f) return;
      if (!ALLOWED.includes(f.type)) {
        toast.error("Unsupported file", {
          description: "Please use a JPG, PNG or WebP image.",
        });
        return;
      }
      if (f.size > MAX_BYTES) {
        toast.error("Image too large", { description: "Maximum size is 8 MB." });
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
      setResult(null);
      setStatus("ready");
    },
    [previewUrl]
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleDetect = async () => {
    if (!file) return;
    setStatus("analyzing");

    const formData = new FormData();
    formData.append("image", file);

    const started = Date.now();
    const res = await detectAndSave(formData);
    const elapsed = Date.now() - started;
    if (elapsed < MIN_SCAN_MS) {
      await new Promise((r) => setTimeout(r, MIN_SCAN_MS - elapsed));
    }

    if (res?.error) {
      toast.error("Detection failed", { description: res.error });
      setStatus("ready");
      return;
    }

    setResult(res);
    setStatus("done");
    toast.success("Analysis complete", {
      description: `Most likely: ${res.label}`,
    });
  };

  return (
    <Card>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        {/* Left: image / dropzone */}
        <div className="relative">
          {!previewUrl ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={cn(
                "flex aspect-square w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-colors",
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/40"
              )}
            >
              <motion.span
                animate={dragging ? { y: -6 } : { y: 0 }}
                className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary"
              >
                <UploadCloud className="size-7" />
              </motion.span>
              <span className="text-sm font-medium">
                Drop an image here, or click to browse
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG or WebP · up to 8 MB
              </span>
            </button>
          ) : (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={previewUrl}
                alt="Selected skin image"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                unoptimized
              />
              <AnimatePresence>
                {status === "analyzing" && <ScanningOverlay />}
              </AnimatePresence>
              {status === "ready" && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-2 size-8 rounded-full shadow"
                  onClick={reset}
                  aria-label="Remove image"
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED.join(",")}
            className="hidden"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />
        </div>

        {/* Right: actions / result */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {status === "done" && result ? (
              <DetectionResult key="result" result={result} onReset={reset} />
            ) : (
              <motion.div
                key="actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ImageIcon className="size-4" />
                  {status === "idle"
                    ? "Upload a clear, well-lit photo of the affected skin."
                    : status === "analyzing"
                      ? "Running the classifier across 10 conditions…"
                      : "Ready to analyze."}
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  disabled={!file || status === "analyzing"}
                  onClick={handleDetect}
                >
                  {status === "analyzing" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" /> Detect disease
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Your image is stored privately in your account and used only to
                  show this result and your scan history.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

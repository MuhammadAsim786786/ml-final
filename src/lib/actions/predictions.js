"use server";

import { classifySkinImage } from "@/lib/inference/predict";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Mock mode: classifies the image and returns the result without any
// Supabase upload or DB insert. The result still comes from the real
// inference module (mock classifier or real endpoint if INFERENCE_API_URL is set).
export async function detectAndSave(formData) {
  const file = formData.get("image");
  if (!file || typeof file.arrayBuffer !== "function") {
    return { error: "No image provided." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { error: "Please upload a JPG, PNG or WebP image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Image is too large (max 8 MB)." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await classifySkinImage(buffer, file.name ?? "image.jpg");

  return {
    id: crypto.randomUUID(),
    label: result.label,
    predictedId: result.predictedId,
    confidence: result.confidence,
    scores: result.scores,
    source: result.source,
    imageUrl: null, // no storage in mock mode
  };
}

// No-op in mock mode.
export async function deletePrediction() {
  return { success: true };
}

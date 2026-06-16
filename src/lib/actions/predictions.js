"use server";

import { classifySkinImage } from "@/lib/inference/predict";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

// Upload the image to Supabase Storage, call the inference module and
// insert a row into `predictions` (server-side).
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ext = (file.name || "jpg").split(".").pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  // Upload to private `scans` bucket.
  const { error: uploadError } = await supabase.storage
    .from("scans")
    .upload(path, buffer, { contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  // Run classifier (may call real inference endpoint or mock fallback).
  const result = await classifySkinImage(buffer, file.name ?? "image.jpg");

  const { data: inserted, error: insertError } = await supabase
    .from("predictions")
    .insert([
      {
        user_id: user.id,
        image_path: path,
        predicted_label: result.label,
        predicted_id: result.predictedId,
        confidence: result.confidence,
        scores: result.scores,
        source: result.source,
      },
    ])
    .select()
    .single();

  if (insertError) return { error: insertError.message };

  const { data: signed } = await supabase.storage
    .from("scans")
    .createSignedUrl(path, 60 * 60);

  return {
    id: inserted.id,
    label: inserted.predicted_label,
    predictedId: inserted.predicted_id,
    confidence: Number(inserted.confidence),
    scores: inserted.scores,
    source: inserted.source,
    imageUrl: signed?.signedUrl ?? null,
  };
}

// Delete a prediction row and its storage object.
export async function deletePrediction(predictionId) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: pred, error: fetchErr } = await supabase
    .from("predictions")
    .select("image_path")
    .eq("id", predictionId)
    .eq("user_id", user.id)
    .single();
  if (fetchErr) return { error: fetchErr.message };

  if (pred?.image_path) {
    await supabase.storage.from("scans").remove([pred.image_path]);
  }

  const { error: delErr } = await supabase
    .from("predictions")
    .delete()
    .eq("id", predictionId)
    .eq("user_id", user.id);
  if (delErr) return { error: delErr.message };

  return { success: true };
}

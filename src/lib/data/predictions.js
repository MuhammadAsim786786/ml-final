import "server-only";
import { createClient } from "@/lib/supabase/server";
import { DISEASES, diseaseLabel } from "@/lib/constants/diseases";

export async function getUserPredictions(limit = 100) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !rows) return [];

  const predictions = await Promise.all(
    rows.map(async (p) => {
      let imageUrl = null;
      if (p.image_path) {
        const { data: signed } = await supabase.storage
          .from("scans")
          .createSignedUrl(p.image_path, 60 * 60);
        imageUrl = signed?.signedUrl ?? null;
      }
      return {
        id: p.id,
        predicted_label: p.predicted_label,
        predicted_id: p.predicted_id,
        confidence: Number(p.confidence),
        created_at: p.created_at,
        imageUrl,
        source: p.source,
        scores: p.scores,
      };
    }),
  );

  return predictions;
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      total: 0,
      avgConfidence: 0,
      topDisease: null,
      topCount: 0,
      byDisease: DISEASES.map((d) => ({
        id: d.id,
        label: d.label,
        count: 0,
        fill: d.chart,
      })),
      trend: [],
      recent: [],
    };
  }

  const { data: rows } = await supabase
    .from("predictions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  const predictions = rows ?? [];

  const total = predictions.length;
  const avgConfidence = total
    ? predictions.reduce((a, p) => a + Number(p.confidence), 0) / total
    : 0;

  const counts = Object.fromEntries(DISEASES.map((d) => [d.id, 0]));
  for (const p of predictions) {
    if (p.predicted_id in counts) counts[p.predicted_id] += 1;
  }

  const byDisease = DISEASES.map((d) => ({
    id: d.id,
    label: d.label,
    count: counts[d.id],
    fill: d.chart,
  }));

  let topDisease = null;
  let topCount = 0;
  for (const d of byDisease) {
    if (d.count > topCount) {
      topCount = d.count;
      topDisease = d.label;
    }
  }

  const trend = predictions
    .slice()
    .reverse()
    .slice(-12)
    .map((p, i) => ({
      index: i + 1,
      confidence: Math.round(Number(p.confidence) * 100),
      label: diseaseLabel(p.predicted_id),
    }));

  const recent = await Promise.all(
    predictions.slice(0, 5).map(async (p) => {
      let imageUrl = null;
      if (p.image_path) {
        const { data: signed } = await supabase.storage
          .from("scans")
          .createSignedUrl(p.image_path, 60 * 60);
        imageUrl = signed?.signedUrl ?? null;
      }
      return {
        id: p.id,
        predicted_label: p.predicted_label,
        predicted_id: p.predicted_id,
        confidence: Number(p.confidence),
        created_at: p.created_at,
        imageUrl,
        source: p.source,
        scores: p.scores,
      };
    }),
  );

  return {
    total,
    avgConfidence,
    topDisease,
    topCount,
    byDisease,
    trend,
    recent,
  };
}

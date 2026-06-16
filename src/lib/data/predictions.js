import "server-only";
import { DISEASES, diseaseLabel } from "@/lib/constants/diseases";

// ---------------------------------------------------------------------------
// Mock data — replace with the Supabase implementation once the project is
// wired up. See the commented-out real version below.
// ---------------------------------------------------------------------------

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const MOCK_SCANS = [
  { id: "1",  predicted_label: "Eczema",                   predicted_id: "eczema",                   confidence: 0.91, created_at: daysAgo(0),  imageUrl: null, source: "mock" },
  { id: "2",  predicted_label: "Psoriasis",                predicted_id: "psoriasis",                confidence: 0.83, created_at: daysAgo(1),  imageUrl: null, source: "mock" },
  { id: "3",  predicted_label: "Ringworm",                 predicted_id: "ringworm",                 confidence: 0.77, created_at: daysAgo(2),  imageUrl: null, source: "mock" },
  { id: "4",  predicted_label: "Nail Fungus",              predicted_id: "nail-fungus",              confidence: 0.88, created_at: daysAgo(3),  imageUrl: null, source: "mock" },
  { id: "5",  predicted_label: "Cellulitis",               predicted_id: "cellulitis",               confidence: 0.95, created_at: daysAgo(4),  imageUrl: null, source: "mock" },
  { id: "6",  predicted_label: "Chickenpox",               predicted_id: "chickenpox",               confidence: 0.72, created_at: daysAgo(5),  imageUrl: null, source: "mock" },
  { id: "7",  predicted_label: "Eczema",                   predicted_id: "eczema",                   confidence: 0.86, created_at: daysAgo(6),  imageUrl: null, source: "mock" },
  { id: "8",  predicted_label: "Impetigo",                 predicted_id: "impetigo",                 confidence: 0.79, created_at: daysAgo(8),  imageUrl: null, source: "mock" },
  { id: "9",  predicted_label: "Athlete's Foot",           predicted_id: "athlete-foot",             confidence: 0.93, created_at: daysAgo(10), imageUrl: null, source: "mock" },
  { id: "10", predicted_label: "Warts / Molluscum",        predicted_id: "warts-molluscum",          confidence: 0.68, created_at: daysAgo(12), imageUrl: null, source: "mock" },
  { id: "11", predicted_label: "Eczema",                   predicted_id: "eczema",                   confidence: 0.89, created_at: daysAgo(14), imageUrl: null, source: "mock" },
  { id: "12", predicted_label: "Cutaneous Larva Migrans",  predicted_id: "cutaneous-larva-migrans",  confidence: 0.74, created_at: daysAgo(16), imageUrl: null, source: "mock" },
  { id: "13", predicted_label: "Psoriasis",                predicted_id: "psoriasis",                confidence: 0.81, created_at: daysAgo(18), imageUrl: null, source: "mock" },
  { id: "14", predicted_label: "Ringworm",                 predicted_id: "ringworm",                 confidence: 0.85, created_at: daysAgo(20), imageUrl: null, source: "mock" },
  { id: "15", predicted_label: "Nail Fungus",              predicted_id: "nail-fungus",              confidence: 0.90, created_at: daysAgo(22), imageUrl: null, source: "mock" },
];

export async function getUserPredictions(limit = 100) {
  return MOCK_SCANS.slice(0, limit);
}

export async function getDashboardStats() {
  const predictions = MOCK_SCANS;
  const total = predictions.length;

  const avgConfidence =
    predictions.reduce((a, p) => a + p.confidence, 0) / total;

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
    if (d.count > topCount) { topCount = d.count; topDisease = d.label; }
  }

  const trend = [...predictions]
    .reverse()
    .slice(-12)
    .map((p, i) => ({
      index: i + 1,
      confidence: Math.round(p.confidence * 100),
      label: diseaseLabel(p.predicted_id),
    }));

  return {
    total,
    avgConfidence,
    topDisease,
    topCount,
    byDisease,
    trend,
    recent: predictions.slice(0, 5),
  };
}

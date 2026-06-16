import "server-only";
import { DISEASES, diseaseLabel } from "@/lib/constants/diseases";

// Normalize any raw scores array into ranked [{ id, label, score }] summing ~1.
function rank(scoresById) {
  const total = Object.values(scoresById).reduce((a, b) => a + b, 0) || 1;
  return DISEASES.map((d) => ({
    id: d.id,
    label: d.label,
    score: (scoresById[d.id] ?? 0) / total,
  })).sort((a, b) => b.score - a.score);
}

// Cheap deterministic hash so the same image yields the same mock prediction.
function hashBuffer(buffer) {
  let h = 2166136261;
  const view = new Uint8Array(buffer);
  const step = Math.max(1, Math.floor(view.length / 4096));
  for (let i = 0; i < view.length; i += step) {
    h ^= view[i];
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mock classifier: builds a plausible softmax-like distribution with one
// dominant class, seeded by the image bytes so results are stable per image.
function mockClassify(buffer) {
  let seed = hashBuffer(buffer);
  const rand = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const top = Math.floor(rand() * DISEASES.length);
  const scoresById = {};
  DISEASES.forEach((d, i) => {
    // Low baseline noise for every class...
    let logit = rand() * 1.5;
    // ...with a strong boost for the chosen dominant class.
    if (i === top) logit += 5 + rand() * 2.5;
    scoresById[d.id] = Math.exp(logit);
  });

  return rank(scoresById);
}

// Calls a real inference endpoint when INFERENCE_API_URL is set, otherwise
// falls back to the mock. Returns { label, confidence, scores, source }.
export async function classifySkinImage(buffer, filename = "image.jpg") {
  const endpoint = process.env.INFERENCE_API_URL;
  let scores;
  let source = "mock";

  if (endpoint) {
    try {
      const form = new FormData();
      form.append(
        "file",
        new Blob([buffer]),
        filename
      );
      const res = await fetch(endpoint, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Inference API returned ${res.status}`);
      const data = await res.json();

      // Accept either { scores: {id: number} } or { predictions: [{label,score}] }.
      const scoresById = {};
      if (data.scores && typeof data.scores === "object") {
        Object.assign(scoresById, data.scores);
      } else if (Array.isArray(data.predictions)) {
        for (const p of data.predictions) {
          if (p.id) scoresById[p.id] = p.score ?? p.confidence ?? 0;
        }
      }
      scores = rank(scoresById);
      source = "model";
    } catch (err) {
      console.error("Inference API failed, falling back to mock:", err.message);
      scores = mockClassify(buffer);
    }
  } else {
    scores = mockClassify(buffer);
  }

  const best = scores[0];
  return {
    label: best.label ?? diseaseLabel(best.id),
    predictedId: best.id,
    confidence: best.score,
    scores,
    source,
  };
}

// The 7 skin-disease classes the DeepSkinCNN v4 model is trained to recognize.
// `id` must match the CLASS_IDS order in src/model/server.py.
// `chart` maps to the --chart-* CSS tokens for consistent coloring.

export const DISEASES = [
  {
    id: "bcc",
    label: "Basal Cell Carcinoma",
    category: "Oncological",
    blurb: "The most common skin cancer; a slow-growing malignant lesion that rarely spreads.",
    severity: "high",
    chart: "var(--chart-5)",
  },
  {
    id: "bkl",
    label: "Benign Keratosis",
    category: "Benign",
    blurb: "Non-cancerous skin growth including seborrheic keratosis and solar lentigo.",
    severity: "low",
    chart: "var(--chart-3)",
  },
  {
    id: "eczema",
    label: "Eczema",
    category: "Inflammatory",
    blurb: "Chronic inflammatory condition causing dry, itchy, and irritated patches.",
    severity: "low",
    chart: "var(--chart-1)",
  },
  {
    id: "melanocytic-nevi",
    label: "Melanocytic Nevi (Moles)",
    category: "Benign",
    blurb: "Common benign clusters of pigmented skin cells (moles); usually harmless.",
    severity: "low",
    chart: "var(--chart-2)",
  },
  {
    id: "melanoma",
    label: "Melanoma",
    category: "Oncological",
    blurb: "The most dangerous form of skin cancer, arising from pigment-producing cells.",
    severity: "high",
    chart: "var(--chart-5)",
  },
  {
    id: "seborrheic-keratoses",
    label: "Seborrheic Keratoses",
    category: "Benign",
    blurb: "Waxy, stuck-on-looking benign skin growths common with age.",
    severity: "low",
    chart: "var(--chart-4)",
  },
  {
    id: "warts-molluscum",
    label: "Warts / Molluscum",
    category: "Viral",
    blurb: "Small firm viral skin growths caused by HPV or molluscum contagiosum.",
    severity: "low",
    chart: "var(--chart-2)",
  },
];

export const DISEASE_IDS = DISEASES.map((d) => d.id);

const DISEASE_MAP = Object.fromEntries(DISEASES.map((d) => [d.id, d]));

export function getDisease(id) {
  return DISEASE_MAP[id] ?? null;
}

export function diseaseLabel(id) {
  return DISEASE_MAP[id]?.label ?? id;
}

export const SEVERITY_STYLES = {
  high: { label: "Urgent", badge: "bg-red-500/15 text-red-600 dark:text-red-400" },
  medium: { label: "Monitor", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  low: { label: "Mild", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
};

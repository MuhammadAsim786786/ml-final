// The 10 skin-disease classes the CNN is trained to recognize.
// `id` is the canonical key used by the model output and stored in the DB.
// `chart` maps to the --chart-* CSS tokens for consistent coloring.

export const DISEASES = [
  {
    id: "cellulitis",
    label: "Cellulitis",
    category: "Bacterial",
    blurb: "Bacterial skin infection causing redness, warmth and swelling.",
    severity: "high",
    chart: "var(--chart-5)",
  },
  {
    id: "impetigo",
    label: "Impetigo",
    category: "Bacterial",
    blurb: "Contagious bacterial infection with a blistering, crusting rash.",
    severity: "medium",
    chart: "var(--chart-5)",
  },
  {
    id: "athlete-foot",
    label: "Athlete's Foot",
    category: "Fungal",
    blurb: "Fungal infection between the toes causing itching and peeling.",
    severity: "low",
    chart: "var(--chart-3)",
  },
  {
    id: "nail-fungus",
    label: "Nail Fungus",
    category: "Fungal",
    blurb: "Fungal infection that thickens and discolours the nails.",
    severity: "low",
    chart: "var(--chart-3)",
  },
  {
    id: "ringworm",
    label: "Ringworm",
    category: "Fungal",
    blurb: "Circular, scaly fungal rash with a raised border.",
    severity: "low",
    chart: "var(--chart-3)",
  },
  {
    id: "chickenpox",
    label: "Chickenpox",
    category: "Viral",
    blurb: "Viral infection producing an itchy, blistering rash.",
    severity: "medium",
    chart: "var(--chart-2)",
  },
  {
    id: "cutaneous-larva-migrans",
    label: "Cutaneous Larva Migrans",
    category: "Parasitic",
    blurb: "Winding, itchy track left by migrating parasitic larvae.",
    severity: "medium",
    chart: "var(--chart-4)",
  },
  {
    id: "eczema",
    label: "Eczema",
    category: "Inflammatory",
    blurb: "Chronic inflammatory condition causing dry, itchy patches.",
    severity: "low",
    chart: "var(--chart-1)",
  },
  {
    id: "psoriasis",
    label: "Psoriasis",
    category: "Autoimmune",
    blurb: "Autoimmune condition producing thick, scaly skin plaques.",
    severity: "medium",
    chart: "var(--chart-1)",
  },
  {
    id: "warts-molluscum",
    label: "Warts / Molluscum",
    category: "Viral",
    blurb: "Small, firm viral skin growths.",
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

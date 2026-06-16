import { classifySkinImage } from "@/lib/inference/predict";

// Mock mode: no auth check, just runs the classifier.
export async function POST(request) {
  const form = await request.formData();
  const file = form.get("file") ?? form.get("image");
  if (!file || typeof file.arrayBuffer !== "function") {
    return Response.json({ error: "No image provided" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await classifySkinImage(buffer, file.name ?? "image.jpg");

  return Response.json(result);
}

import { PageTransition } from "@/components/layout/page-transition";
import { ImageUploader } from "@/components/detect/image-uploader";

export const metadata = { title: "Detect — DermaScan" };

export default function DetectPage() {
  return (
    <PageTransition className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Detect disease</h1>
        <p className="text-sm text-muted-foreground">
          Upload a skin image and the model will classify it across 10 conditions.
        </p>
      </div>
      <ImageUploader />
    </PageTransition>
  );
}

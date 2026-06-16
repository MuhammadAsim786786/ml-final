import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/data/profile";
import { PageTransition } from "@/components/layout/page-transition";
import { ProfileForm } from "@/components/profile/profile-form";

export const metadata = { title: "Profile — DermaScan" };

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect("/login");

  return (
    <PageTransition className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </PageTransition>
  );
}

import { redirect } from "next/navigation";

// Mock mode: always go straight to the dashboard.
export default function Home() {
  redirect("/dashboard");
}

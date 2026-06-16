import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

// Mock mode: no auth check, hardcoded demo user for the shell.
const MOCK_PROFILE = {
  fullName: "Demo User",
  email: "demo@dermascan.app",
};

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar fullName={MOCK_PROFILE.fullName} email={MOCK_PROFILE.email} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

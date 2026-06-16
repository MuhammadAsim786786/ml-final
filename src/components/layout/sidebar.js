import { Logo } from "@/components/layout/logo";
import { NavLinks } from "@/components/layout/nav-links";

// Desktop sidebar (hidden on small screens; the topbar hosts mobile nav).
export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
      <div className="px-2">
        <Logo />
      </div>
      <div className="mt-8 flex-1">
        <NavLinks />
      </div>
      <div className="rounded-lg bg-sidebar-accent/60 p-3 text-xs text-sidebar-foreground/70">
        <p className="font-medium text-sidebar-foreground">Heads up</p>
        Predictions are AI estimates — always confirm with a clinician.
      </div>
    </aside>
  );
}

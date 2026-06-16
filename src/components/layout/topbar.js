import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";

// Sticky top bar: mobile menu + page title (left), theme + user (right).
export function Topbar({ fullName, email }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav />
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu fullName={fullName} email={email} />
      </div>
    </header>
  );
}

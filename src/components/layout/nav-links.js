"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayoutDashboard, ScanLine, History, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/detect", label: "Detect", icon: ScanLine },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export function NavLinks({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-lg bg-sidebar-primary"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <Icon className="size-[18px] shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

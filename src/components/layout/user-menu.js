"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { signout } from "@/lib/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name, email) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function UserMenu({ fullName, email }) {
  return (
    <DropdownMenu>
      {/*
        DropdownMenuTrigger (@base-ui/react) renders its own <button>.
        Never wrap it in a <Button> — that creates button-in-button.
        Style it directly with className instead.
      */}
      <DropdownMenuTrigger
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md px-1.5 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="User menu"
      >
        <Avatar className="size-7">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {initials(fullName, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[10rem] truncate sm:inline">
          {fullName || email}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">
          <span className="block text-sm font-medium">{fullName || "Account"}</span>
          <span className="block truncate text-xs text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* DropdownMenuItem renders a div, so <a> and <button> children are fine. */}
        <DropdownMenuItem>
          <Link href="/profile" className="flex w-full items-center gap-2">
            <UserIcon className="size-4" /> Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" className="p-0">
          <form action={signout} className="w-full">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-1.5 px-1.5 py-1 text-destructive"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

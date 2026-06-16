"use client";

import { useActionState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { motion } from "motion/react";
import { Loader2, Check, Monitor, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { updateProfile } from "@/lib/actions/profile";
import { signout } from "@/lib/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ProfileForm({ profile }) {
  const [state, formAction, isPending] = useActionState(updateProfile, {});

  useEffect(() => {
    if (state?.success) toast.success("Profile updated");
  }, [state]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
          <CardDescription>Update how your name appears in the app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={profile.fullName}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check className="size-4" /> Save changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
          <CardDescription>Sign out of your account on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          <form action={signout}>
            <Button type="submit" variant="destructive">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const current = mounted ? theme : undefined;

  return (
    <div className="grid grid-cols-3 gap-3 sm:max-w-md">
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
              active
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {active && (
              <motion.span
                layoutId="theme-active"
                className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground"
              >
                <Check className="size-3" />
              </motion.span>
            )}
            <Icon className="size-5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

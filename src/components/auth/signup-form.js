"use client";

import { useActionState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Loader2, UserPlus } from "lucide-react";
import { signup } from "@/lib/actions/auth";
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

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signup, {});

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/60 shadow-xl shadow-primary/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Start screening skin images in seconds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 6 characters"
                required
              />
            </div>

            {state?.error && (
              <p
                className={`rounded-md px-3 py-2 text-sm ${
                  state.info
                    ? "bg-primary/10 text-primary"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {state.error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  <UserPlus className="size-4" /> Create account
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

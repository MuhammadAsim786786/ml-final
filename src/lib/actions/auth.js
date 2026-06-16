"use server";

import { redirect } from "next/navigation";

// Mock mode: auth actions are no-ops that redirect straight to the dashboard.
export async function login() {
  redirect("/dashboard");
}

export async function signup() {
  redirect("/dashboard");
}

export async function signout() {
  redirect("/dashboard");
}

"use client";

import React from "react";
import { PageShell } from "./ui/PageShell";

/**
 * AppShell wraps the application with the survey instrument layout.
 * Maintains layout isolation for Field Mode (/field).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return <PageShell>{children}</PageShell>;
}

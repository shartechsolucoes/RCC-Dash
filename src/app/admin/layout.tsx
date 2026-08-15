"use client";

import { RequireRole } from "@/components/RequireRole";
import { TOP_ROLES } from "@/lib/permissions";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={TOP_ROLES}>{children}</RequireRole>;
}

"use client";

import { RequireRole } from "@/components/RequireRole";
import { MANAGEMENT_ROLES } from "@/lib/permissions";

export default function NovaEmpresaLayout({ children }: { children: React.ReactNode }) {
  return <RequireRole roles={MANAGEMENT_ROLES}>{children}</RequireRole>;
}

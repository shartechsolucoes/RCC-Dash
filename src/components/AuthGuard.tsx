"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getToken } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const PUBLIC_ROUTES = ["/login", "/inscricoes/nova"];
const PUBLIC_ROUTE_PATTERNS = [/^\/eventos\/[^/]+\/inscricao$/];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) || PUBLIC_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));

  useEffect(() => {
    if (isPublicRoute) return;

    if (!getToken()) {
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [pathname, router, isPublicRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (!ready) {
    return null;
  }

  return (
    <div className="flex flex-1 gap-4 p-4">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
        <Topbar />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

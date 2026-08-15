"use client";

import { ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchMe } from "@/lib/auth";
import { hasAccess, type ProfileLevel } from "@/lib/permissions";

export function RequireRole({ roles, children }: { roles: ProfileLevel[]; children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let active = true;
    fetchMe().then((me) => {
      if (!active) return;
      setStatus(hasAccess(me?.profileLevel, roles) ? "allowed" : "denied");
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "checking") return null;

  if (status === "denied") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-24 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
          <ShieldAlert size={22} />
        </span>
        <p className="text-lg font-medium text-zinc-900">Acesso não permitido</p>
        <p className="max-w-sm text-sm text-zinc-500">
          Seu perfil não tem permissão para acessar esta área. Fale com a coordenação se acredita que isso é um engano.
        </p>
      </main>
    );
  }

  return <>{children}</>;
}

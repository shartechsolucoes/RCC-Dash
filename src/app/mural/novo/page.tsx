"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchMe, type CurrentUser } from "@/lib/auth";
import { hasAccess, MANAGEMENT_ROLES, TOP_ROLES } from "@/lib/permissions";
import { MuralPostForm } from "@/components/MuralPostForm";

export default function NovoAvisoPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  const canPublish = hasAccess(user?.profileLevel, TOP_ROLES);

  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <Link href="/mural" className="text-sm text-slate-400 hover:text-slate-700">
          ← Mural
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Novo aviso</h1>
      </div>

      {user && !hasAccess(user.profileLevel, MANAGEMENT_ROLES) ? (
        <p className="text-sm text-slate-500">Seu perfil não tem permissão para publicar no mural.</p>
      ) : (
        <MuralPostForm canPublish={canPublish} />
      )}
    </main>
  );
}

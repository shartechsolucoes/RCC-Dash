"use client";

import { TeamTypesManager } from "@/components/TeamTypesManager";

export default function TiposEquipePage() {
  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Tipos de equipe</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Catálogo global usado em todos os eventos. Cada fraternidade pode ter tipos próprios na sua página.
      </p>
      <TeamTypesManager canManage />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface UserRow {
  id: string;
  email: string;
  profileLevel: "ROOT" | "COORDENACAO_GERAL" | "COORDENADOR" | "MEMBRO";
  isActive: boolean;
  member: { fullName: string } | null;
}

const PROFILE_LABEL: Record<UserRow["profileLevel"], string> = {
  ROOT: "Root",
  COORDENACAO_GERAL: "Coordenação Geral",
  COORDENADOR: "Coordenador",
  MEMBRO: "Membro",
};

export default function UsuariosAdminPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);

  function load() {
    apiFetch("/users")
      .then((res) => (res.ok ? res.json() : []))
      .then(setUsers);
  }

  useEffect(load, []);

  async function handleProfileChange(id: string, profileLevel: UserRow["profileLevel"]) {
    await apiFetch(`/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileLevel }),
    });
    load();
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    await apiFetch(`/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    load();
  }

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Usuários</h1>

      {users === null && <p className="mt-4 text-sm text-zinc-500">Carregando...</p>}

      {users && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {user.member?.fullName ?? user.email}
                </p>
                <p className="truncate text-sm text-zinc-500">{user.email}</p>
              </div>

              <select
                value={user.profileLevel}
                onChange={(e) => handleProfileChange(user.id, e.target.value as UserRow["profileLevel"])}
                className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm text-zinc-700"
              >
                {Object.entries(PROFILE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => handleToggleActive(user.id, user.isActive)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  user.isActive ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {user.isActive ? "Ativo" : "Inativo"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

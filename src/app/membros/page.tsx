"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface MemberSummary {
  id: string;
  fullName: string;
  photoUrl: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  user: { email: string; profileLevel: string; isActive: boolean };
}

const PROFILE_LABEL: Record<string, string> = {
  ROOT: "Root",
  COORDENACAO_GERAL: "Coordenação Geral",
  COORDENADOR: "Coordenador",
  MEMBRO: "Membro",
};

const PROFILE_STYLE: Record<string, string> = {
  ROOT: "bg-zinc-900 text-white",
  COORDENACAO_GERAL: "bg-purple-50 text-purple-700",
  COORDENADOR: "bg-blue-50 text-blue-700",
  MEMBRO: "bg-zinc-100 text-zinc-600",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function MembrosPage() {
  const [members, setMembers] = useState<MemberSummary[] | null>(null);

  function load() {
    apiFetch("/members")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMembers);
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este membro? Isso remove a conta de acesso também.")) return;
    await apiFetch(`/members/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Membros</h1>

      {members === null && <p className="mt-4 text-sm text-zinc-500">Carregando...</p>}

      {members?.length === 0 && <p className="mt-4 text-sm text-zinc-500">Nenhum membro cadastrado.</p>}

      {members && members.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 px-5 py-4">
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-medium text-zinc-500">
                  {initials(member.fullName)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{member.fullName}</p>
                <p className="truncate text-sm text-zinc-500">
                  {member.user.email}
                  {member.phone && (
                    <>
                      <span className="mx-1.5 text-zinc-300">·</span>
                      {member.phone}
                    </>
                  )}
                  {member.city && (
                    <>
                      <span className="mx-1.5 text-zinc-300">·</span>
                      {member.city}
                      {member.state ? `/${member.state}` : ""}
                    </>
                  )}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${PROFILE_STYLE[member.user.profileLevel]}`}>
                {PROFILE_LABEL[member.user.profileLevel] ?? member.user.profileLevel}
              </span>
              {!member.user.isActive && (
                <span className="shrink-0 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600">
                  Inativo
                </span>
              )}
              <Link
                href={`/membros/${member.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
              >
                <Pencil size={15} />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(member.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

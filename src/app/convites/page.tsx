"use client";

import { Mail, Plus, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { RequireRole } from "@/components/RequireRole";
import { TOP_ROLES } from "@/lib/permissions";

interface Invitation {
  id: string;
  email: string;
  profileLevel: string;
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  expiresAt: string;
}

const PROFILE_LABEL: Record<string, string> = {
  ROOT: "Root",
  COORDENACAO_GERAL: "Coordenação Geral",
  COORDENADOR: "Coordenador",
  MEMBRO: "Membro",
};

const STATUS_STYLE: Record<Invitation["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-green-50 text-green-700",
  EXPIRED: "bg-zinc-100 text-zinc-500",
  REVOKED: "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<Invitation["status"], string> = {
  PENDING: "Pendente",
  ACCEPTED: "Aceito",
  EXPIRED: "Expirado",
  REVOKED: "Revogado",
};

export default function ConvitesPage() {
  const [invitations, setInvitations] = useState<Invitation[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch("/invitations")
      .then((res) => (res.ok ? res.json() : []))
      .then(setInvitations);
  }

  useEffect(load, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await apiFetch("/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), profileLevel: form.get("profileLevel") }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível criar o convite");
      return;
    }

    setShowForm(false);
    load();
  }

  async function handleRevoke(id: string) {
    await apiFetch(`/invitations/${id}/revoke`, { method: "PATCH" });
    load();
  }

  return (
    <RequireRole roles={TOP_ROLES}>
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Convites</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Novo convite"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5 sm:max-w-md">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            E-mail
            <input type="email" name="email" required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Perfil
            <select name="profileLevel" defaultValue="MEMBRO" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
              {Object.entries(PROFILE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button type="submit" className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Enviar convite
          </button>
        </form>
      )}

      {invitations === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {invitations?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhum convite enviado.</p>}

      {invitations && invitations.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="flex items-center gap-3 px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Mail size={16} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">{invitation.email}</p>
                <p className="text-sm text-zinc-500">{PROFILE_LABEL[invitation.profileLevel]}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[invitation.status]}`}>
                {STATUS_LABEL[invitation.status]}
              </span>
              {invitation.status === "PENDING" && (
                <button
                  type="button"
                  onClick={() => handleRevoke(invitation.id)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Revogar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
    </RequireRole>
  );
}

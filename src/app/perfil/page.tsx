"use client";

import { Calendar, KeyRound, MapPin, Shield, User, Users } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

type Status = "idle" | "saving" | "saved" | "error";
type PasswordStatus = "idle" | "saving" | "saved" | "error";

const inputClass =
  "rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100";

const PROFILE_LABEL: Record<string, string> = {
  ROOT: "Root",
  COORDENACAO_GERAL: "Coordenação Geral",
  COORDENADOR: "Coordenador",
  MEMBRO: "Membro",
};

function formatMemberSince(value?: string) {
  if (!value) return "–";
  return new Date(value).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

export default function PerfilPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [groupCount, setGroupCount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [passwordStatus, setPasswordStatus] = useState<PasswordStatus>("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
    apiFetch("/groups/my-groups")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setGroupCount(data.length));
  }, []);

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setPasswordStatus("error");
      setPasswordError("As senhas não coincidem");
      return;
    }

    setPasswordStatus("saving");
    setPasswordError(null);

    const response = await apiFetch("/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: data.get("currentPassword"),
        newPassword,
      }),
    });

    if (response.ok) {
      setPasswordStatus("saved");
      form.reset();
    } else {
      const body = await response.json().catch(() => null);
      setPasswordStatus("error");
      setPasswordError(body?.message ?? "Não foi possível trocar a senha");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.member) return;

    setStatus("saving");
    const form = new FormData(event.currentTarget);
    const birthDate = form.get("birthDate");

    const response = await apiFetch(`/members/${user.member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        phone: form.get("phone") || undefined,
        city: form.get("city") || undefined,
        state: form.get("state") || undefined,
        photoUrl: form.get("photoUrl") || undefined,
        birthDate: birthDate ? new Date(String(birthDate)).toISOString() : undefined,
      }),
    });

    if (response.ok) {
      setStatus("saved");
      fetchMe().then(setUser);
    } else {
      setStatus("error");
    }
  }

  if (!user) {
    return (
      <main className="px-4 py-8 sm:px-8">
        <p className="text-sm text-slate-500">Carregando...</p>
      </main>
    );
  }

  const displayName = user.member?.fullName || user.email;
  const profileLabel = PROFILE_LABEL[user.profileLevel] ?? user.profileLevel;

  return (
    <main className="flex flex-col gap-5 px-4 py-8 sm:px-8">
      {/* Header: banner + avatar + stats */}
      <div className="overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm">
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary-600 via-violet-600 to-primary-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1"
            className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 opacity-15"
          >
            <path d="M12 2v20M6 8h12" strokeLinecap="round" />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <div className="-mt-10 shrink-0">
            <ImageUpload name="photoUrl" defaultValue={user.member?.photoUrl} shape="square" />
          </div>

          <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:pb-1 sm:text-left">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-slate-900">{displayName}</p>
              <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
                {profileLabel}
              </span>
            </div>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-zinc-100 border-t border-zinc-100 sm:grid-cols-4 sm:divide-y-0">
          <div className="flex flex-col items-center gap-1 px-4 py-4">
            <span className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <Shield size={15} className="text-primary-500" />
              {profileLabel}
            </span>
            <span className="text-xs text-slate-400">Perfil de acesso</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-4">
            <span className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <Users size={15} className="text-violet-500" />
              {groupCount ?? "–"}
            </span>
            <span className="text-xs text-slate-400">Fraternidades</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-4">
            <span className="flex items-center gap-1.5 text-lg font-bold text-slate-900">
              <MapPin size={15} className="text-warning-500" />
              {user.member?.city || "–"}
            </span>
            <span className="text-xs text-slate-400">Cidade</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-4 py-4">
            <span className="flex items-center gap-1.5 text-lg font-bold capitalize text-slate-900">
              <Calendar size={15} className="text-success-500" />
              {formatMemberSince(user.member?.createdAt)}
            </span>
            <span className="text-xs text-slate-400">Membro desde</span>
          </div>
        </div>
      </div>

      {/* Two-column content */}
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <User size={15} />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">Informações pessoais</h2>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                Nome completo
                <input
                  name="fullName"
                  defaultValue={user.member?.fullName}
                  required
                  minLength={3}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700 sm:col-span-2">
                E-mail
                <input
                  value={user.email}
                  disabled
                  className="cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-400"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Telefone
                <input name="phone" defaultValue={user.member?.phone ?? ""} className={inputClass} />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Data de nascimento
                <input
                  type="date"
                  name="birthDate"
                  defaultValue={user.member?.birthDate ? user.member.birthDate.slice(0, 10) : ""}
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <MapPin size={15} />
              </span>
              <h2 className="text-sm font-semibold text-slate-900">Localização</h2>
            </div>

            <div className="mt-5 grid grid-cols-[1fr_100px] gap-5">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Cidade
                <input name="city" defaultValue={user.member?.city ?? ""} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                UF
                <input name="state" defaultValue={user.member?.state ?? ""} maxLength={2} className={inputClass} />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {status === "saving" ? "Salvando..." : "Salvar alterações"}
            </button>

            {status === "error" && (
              <p className="rounded-lg bg-danger-50 px-3 py-1.5 text-sm text-danger-600">Não foi possível salvar</p>
            )}
            {status === "saved" && (
              <p className="rounded-lg bg-success-50 px-3 py-1.5 text-sm text-success-700">Perfil atualizado</p>
            )}
          </div>
        </form>

        <form onSubmit={handlePasswordSubmit} className="flex h-fit flex-col gap-5 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <KeyRound size={15} />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">Segurança</h2>
          </div>

          <div className="grid gap-5">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Senha atual
              <input type="password" name="currentPassword" required minLength={8} className={inputClass} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Nova senha
              <input type="password" name="newPassword" required minLength={8} className={inputClass} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Confirmar nova senha
              <input type="password" name="confirmPassword" required minLength={8} className={inputClass} />
            </label>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={passwordStatus === "saving"}
              className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
            >
              {passwordStatus === "saving" ? "Salvando..." : "Trocar senha"}
            </button>

            {passwordStatus === "error" && (
              <p className="rounded-lg bg-danger-50 px-3 py-1.5 text-sm text-danger-600">{passwordError}</p>
            )}
            {passwordStatus === "saved" && (
              <p className="rounded-lg bg-success-50 px-3 py-1.5 text-sm text-success-700">Senha atualizada</p>
            )}
          </div>
        </form>
      </div>
    </main>
  );
}

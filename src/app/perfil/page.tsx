"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

type Status = "idle" | "saving" | "saved" | "error";

const inputClass =
  "rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 transition-colors outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100";

export default function PerfilPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

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

  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Meu Perfil</h1>
        <p className="mt-1 text-sm text-slate-500">Gerencie suas informações pessoais e de contato.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="card flex flex-col items-center gap-4 sm:flex-row sm:items-center">
          {user.member?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.member.photoUrl}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-primary-50"
            />
          ) : (
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-600 text-2xl font-semibold text-white ring-4 ring-primary-50">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}

          <div className="flex flex-1 flex-col items-center gap-1 text-center sm:items-start sm:text-left">
            <p className="text-base font-semibold text-slate-900">{displayName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>

          <div className="w-full shrink-0 sm:w-auto">
            <ImageUpload name="photoUrl" defaultValue={user.member?.photoUrl} shape="circle" />
          </div>
        </div>

        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Informações pessoais</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Nome completo
              <input
                name="fullName"
                defaultValue={user.member?.fullName}
                required
                minLength={3}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
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

        <div className="card flex flex-col gap-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Localização</h2>

          <div className="grid grid-cols-[1fr_100px] gap-5">
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
    </main>
  );
}

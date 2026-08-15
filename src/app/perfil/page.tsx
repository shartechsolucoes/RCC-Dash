"use client";

import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

type Status = "idle" | "saving" | "saved" | "error";

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
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Meu Perfil</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-md flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          E-mail
          <input
            value={user.email}
            disabled
            className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Nome completo
          <input
            name="fullName"
            defaultValue={user.member?.fullName}
            required
            minLength={3}
            className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
          />
        </label>

        <ImageUpload
          name="photoUrl"
          label="Foto"
          defaultValue={user.member?.photoUrl}
          shape="circle"
        />

        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Telefone
          <input
            name="phone"
            defaultValue={user.member?.phone ?? ""}
            className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Data de nascimento
          <input
            type="date"
            name="birthDate"
            defaultValue={user.member?.birthDate ? user.member.birthDate.slice(0, 10) : ""}
            className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
          />
        </label>

        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
            Cidade
            <input
              name="city"
              defaultValue={user.member?.city ?? ""}
              className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
            />
          </label>
          <label className="flex w-20 flex-col gap-1 text-sm text-zinc-600">
            UF
            <input
              name="state"
              defaultValue={user.member?.state ?? ""}
              maxLength={2}
              className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
            />
          </label>
        </div>

        {status === "error" && <p className="text-sm text-red-600">Não foi possível salvar</p>}
        {status === "saved" && <p className="text-sm text-green-600">Perfil atualizado</p>}

        <button
          type="submit"
          disabled={status === "saving"}
          className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {status === "saving" ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </main>
  );
}

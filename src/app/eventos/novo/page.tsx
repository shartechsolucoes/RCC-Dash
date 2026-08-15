"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { apiFetch } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

interface GroupOption {
  id: string;
  name: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NovoEventoPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));

    const response = await apiFetch("/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug: `${slugify(name)}-${Date.now().toString(36)}`,
        description: form.get("description") || undefined,
        coverImageUrl: form.get("coverImageUrl") || undefined,
        location: form.get("location") || undefined,
        groupId: form.get("groupId") || undefined,
        startDate: new Date(String(form.get("startDate"))).toISOString(),
        endDate: new Date(String(form.get("endDate"))).toISOString(),
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setErrorMessage("Não foi possível criar o evento");
      return;
    }

    const created = await response.json();
    router.push(`/eventos/${created.id}`);
  }

  return (
    <main className="px-8 py-8">
      <Link href="/eventos" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Eventos
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Novo evento</h1>

      <form onSubmit={handleCreate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
        <ImageUpload name="coverImageUrl" label="Capa" />
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Nome
          <input name="name" required minLength={3} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Descrição
          <textarea name="description" rows={3} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Local
          <input name="location" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Fraternidade responsável
          <select name="groupId" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
            <option value="">—</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Início
          <input type="datetime-local" name="startDate" required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Fim
          <input type="datetime-local" name="endDate" required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
        </label>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "Salvando..." : "Criar evento"}
          </button>
          <Link
            href="/eventos"
            className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}

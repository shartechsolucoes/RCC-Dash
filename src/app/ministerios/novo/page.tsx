"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { RichTextEditor } from "@/components/RichTextEditor";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NovoMinisterioPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));

    const response = await apiFetch("/ministries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name), description: form.get("description") || undefined }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível criar o ministério");
      return;
    }

    const created = await response.json();
    router.push(`/ministerios/${created.id}`);
  }

  return (
    <main className="px-8 py-8">
      <Link href="/ministerios" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Ministérios
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Novo ministério</h1>

      <form onSubmit={handleCreate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Nome
          <input name="name" required minLength={2} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
        </label>
        <RichTextEditor name="description" label="Descrição" />
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <div className="flex gap-2">
          <button type="submit" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Criar ministério
          </button>
          <Link href="/ministerios" className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}

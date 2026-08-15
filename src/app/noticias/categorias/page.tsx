"use client";

import { Plus, Tag, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { RequireRole } from "@/components/RequireRole";
import { MANAGEMENT_ROLES } from "@/lib/permissions";

interface Category {
  id: string;
  name: string;
  slug: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewsCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch("/news/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
  }

  useEffect(load, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name"));

    const response = await apiFetch("/news/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: slugify(name) }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setErrorMessage(body?.message ?? "Não foi possível criar a categoria");
      return;
    }

    (event.target as HTMLFormElement).reset();
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta categoria?")) return;
    const response = await apiFetch(`/news/categories/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      window.alert(body?.message ?? "Não foi possível excluir a categoria");
      return;
    }
    load();
  }

  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/noticias" className="text-sm text-zinc-400 hover:text-zinc-700">
            ← Notícias
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Categorias</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Nova categoria"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5 sm:max-w-sm">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Nome
            <input name="name" required minLength={2} placeholder="Institucional, Eventos, Missões..." className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button type="submit" className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Salvar
          </button>
        </form>
      )}

      {categories === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {categories?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhuma categoria cadastrada ainda.</p>}

      {categories && categories.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100 sm:max-w-sm">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-3 px-5 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Tag size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{category.name}</p>
                <p className="truncate text-xs text-zinc-400">{category.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(category.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
    </RequireRole>
  );
}

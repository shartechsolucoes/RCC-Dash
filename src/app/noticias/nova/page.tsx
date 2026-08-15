"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";
import { RequireRole } from "@/components/RequireRole";
import { RichTextEditor } from "@/components/RichTextEditor";
import { MANAGEMENT_ROLES } from "@/lib/permissions";

interface Category {
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

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function NewNewsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/news/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title"));
    const publishedAt = form.get("publishedAt");

    const response = await apiFetch("/news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subtitle: form.get("subtitle") || undefined,
        slug: `${slugify(title)}-${Date.now().toString(36)}`,
        categoryId: form.get("categoryId"),
        isInternal: form.get("isInternal") === "on",
        content: form.get("content"),
        coverImageUrl: form.get("coverImageUrl") || undefined,
        publishedAt: publishedAt ? new Date(String(publishedAt)).toISOString() : undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível criar a notícia");
      return;
    }

    router.push("/noticias");
  }

  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
    <main className="px-8 py-8">
      <Link href="/noticias" className="text-sm text-zinc-400 hover:text-zinc-700">← Notícias</Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Nova notícia</h1>

      <form onSubmit={handleCreate} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 p-6">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Título
            <input
              name="title"
              required
              minLength={3}
              className="rounded-md border border-zinc-200 px-3 py-2.5 text-lg font-medium text-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Subtítulo
            <input name="subtitle" placeholder="Opcional" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <RichTextEditor name="content" label="Conteúdo" />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-900">Publicação</p>

            <ImageUpload name="coverImageUrl" label="Capa" />

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Categoria
              <select name="categoryId" required defaultValue="" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
                <option value="" disabled>Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" name="isInternal" className="h-4 w-4 rounded border-zinc-300" />
              Notícia interna (visível somente para membros logados)
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Data de publicação
              <input
                type="datetime-local"
                name="publishedAt"
                defaultValue={toLocalInputValue(new Date())}
                className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
              />
              <span className="text-xs text-zinc-400">Uma data futura agenda a publicação.</span>
            </label>

            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

            <button type="submit" className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              Salvar
            </button>
          </div>
        </div>
      </form>
    </main>
    </RequireRole>
  );
}

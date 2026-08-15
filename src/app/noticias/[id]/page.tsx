"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

interface NewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  categoryId: string;
  isInternal: boolean;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditNewsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [news, setNews] = useState<NewsItem | null | "not-found">(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/news/categories")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories);
  }, []);

  useEffect(() => {
    apiFetch("/news")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: NewsItem[]) => {
        const found = all.find((item) => item.id === params.id);
        setNews(found ?? "not-found");
      });
  }, [params.id]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const publishedAt = form.get("publishedAt");

    const response = await apiFetch(`/news/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        subtitle: form.get("subtitle") || undefined,
        categoryId: form.get("categoryId"),
        isInternal: form.get("isInternal") === "on",
        content: form.get("content"),
        coverImageUrl: form.get("coverImageUrl") || undefined,
        publishedAt: publishedAt ? new Date(String(publishedAt)).toISOString() : undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar as alterações");
      return;
    }

    router.push("/noticias");
  }

  if (news === "not-found") {
    return (
      <RequireRole roles={MANAGEMENT_ROLES}>
      <main className="px-8 py-8">
        <Link href="/noticias" className="text-sm text-zinc-400 hover:text-zinc-700">← Notícias</Link>
        <p className="mt-6 text-sm text-zinc-500">Notícia não encontrada.</p>
      </main>
      </RequireRole>
    );
  }

  if (!news) {
    return (
      <RequireRole roles={MANAGEMENT_ROLES}>
      <main className="px-8 py-8">
        <Link href="/noticias" className="text-sm text-zinc-400 hover:text-zinc-700">← Notícias</Link>
        <p className="mt-6 text-sm text-zinc-500">Carregando...</p>
      </main>
      </RequireRole>
    );
  }

  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
    <main className="px-8 py-8">
      <Link href="/noticias" className="text-sm text-zinc-400 hover:text-zinc-700">← Notícias</Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Editar notícia</h1>

      <form onSubmit={handleUpdate} className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 p-6">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Título
            <input
              name="title"
              defaultValue={news.title}
              required
              minLength={3}
              className="rounded-md border border-zinc-200 px-3 py-2.5 text-lg font-medium text-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Subtítulo
            <input name="subtitle" defaultValue={news.subtitle ?? ""} placeholder="Opcional" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <RichTextEditor name="content" label="Conteúdo" defaultValue={news.content} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-900">Publicação</p>

            <ImageUpload name="coverImageUrl" label="Capa" defaultValue={news.coverImageUrl} />

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Categoria
              <select name="categoryId" defaultValue={news.categoryId} required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <input type="checkbox" name="isInternal" defaultChecked={news.isInternal} className="h-4 w-4 rounded border-zinc-300" />
              Notícia interna (visível somente para membros logados)
            </label>

            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Data de publicação
              <input
                type="datetime-local"
                name="publishedAt"
                defaultValue={news.publishedAt ? toLocalInputValue(new Date(news.publishedAt)) : ""}
                className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
              />
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

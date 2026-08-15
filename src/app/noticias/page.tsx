"use client";

import { Archive, CheckCircle2, Newspaper, Pencil, Plus, RotateCcw, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";
import { RequireRole } from "@/components/RequireRole";
import { MANAGEMENT_ROLES } from "@/lib/permissions";

type NewsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  categoryId: string;
  category: { id: string; name: string };
  isInternal: boolean;
  status: NewsStatus;
  publishedAt: string | null;
  viewCount: number;
  author: { email: string; member: { fullName: string } | null };
}

const STATUS_META: Record<NewsStatus, { label: string; style: string }> = {
  DRAFT: { label: "Rascunho", style: "bg-zinc-100 text-zinc-500" },
  PUBLISHED: { label: "Publicada", style: "bg-green-50 text-green-700" },
  ARCHIVED: { label: "Arquivada", style: "bg-red-50 text-red-600" },
};

export default function NoticiasPage() {
  const [news, setNews] = useState<NewsItem[] | null>(null);

  function load() {
    apiFetch("/news")
      .then((res) => (res.ok ? res.json() : []))
      .then(setNews);
  }

  useEffect(load, []);

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta notícia?")) return;
    await apiFetch(`/news/${id}`, { method: "DELETE" });
    load();
  }

  async function handleStatusChange(id: string, status: NewsStatus) {
    await apiFetch(`/news/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Notícias</h1>
          <Link href="/noticias/categorias" className="mt-1 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-700">
            <Tag size={13} /> Gerenciar categorias
          </Link>
        </div>
        <Link
          href="/noticias/nova"
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus size={16} />
          Nova notícia
        </Link>
      </div>

      {news === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {news?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhuma notícia publicada ainda.</p>}

      {news && news.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {news.map((item) => {
            const status = STATUS_META[item.status];
            return (
              <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Newspaper size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{item.title}</p>
                  <p className="truncate text-sm text-zinc-500">
                    {item.author.member?.fullName ?? item.author.email}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {item.category?.name ?? "Sem categoria"}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {item.isInternal ? "Interna" : "Externa"}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {item.viewCount} leitura{item.viewCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                  {status.label}
                </span>
                {item.status !== "PUBLISHED" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, "PUBLISHED")}
                    title="Publicar"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-green-50 hover:text-green-600"
                  >
                    <CheckCircle2 size={15} />
                  </button>
                )}
                {item.status !== "ARCHIVED" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, "ARCHIVED")}
                    title="Arquivar"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Archive size={15} />
                  </button>
                )}
                {item.status !== "DRAFT" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(item.id, "DRAFT")}
                    title="Mover para rascunho"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <RotateCcw size={15} />
                  </button>
                )}
                <Link href={`/noticias/${item.id}`} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
                  <Pencil size={15} />
                </Link>
                <button type="button" onClick={() => handleDelete(item.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
    </RequireRole>
  );
}

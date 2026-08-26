"use client";

import { Archive, Plus, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";
import { hasAccess, MANAGEMENT_ROLES, TOP_ROLES } from "@/lib/permissions";

interface Post {
  id: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  eventDate: string | null;
  isPublic: boolean;
  createdAt: string;
  author: { email: string; member: { fullName: string; photoUrl: string | null } | null };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MuralPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);

  function load() {
    apiFetch("/mural")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts);
  }

  useEffect(load, []);
  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  const canPost = hasAccess(user?.profileLevel, MANAGEMENT_ROLES);
  const isTopManager = hasAccess(user?.profileLevel, TOP_ROLES);

  function canManage(post: Post) {
    return isTopManager || (canPost && post.author.email === user?.email);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta postagem? Essa ação não pode ser desfeita.")) return;
    await apiFetch(`/mural/${id}`, { method: "DELETE" });
    load();
  }

  async function handleArchive(id: string) {
    if (!window.confirm("Arquivar esta postagem? Ela sai do mural, mas fica guardada.")) return;
    await apiFetch(`/mural/${id}/archive`, { method: "PATCH" });
    load();
  }

  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Mural</h1>
          <p className="mt-1 text-sm text-slate-500">Avisos e recados compartilhados com a comunidade.</p>
        </div>
        {canPost && (
          <Link
            href="/mural/novo"
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            <Plus size={16} />
            Novo aviso
          </Link>
        )}
      </div>

      {posts === null && <p className="text-sm text-slate-500">Carregando...</p>}
      {posts?.length === 0 && <p className="text-sm text-slate-500">Nenhuma postagem ainda.</p>}

      {posts && posts.length > 0 && (
        <div className="flex flex-col divide-y divide-slate-100">
          {posts.map((post) => (
            <div key={post.id} className="group flex items-start gap-4 py-4">
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  {post.title && <p className="text-sm font-medium text-slate-900">{post.title}</p>}
                  <p className="truncate text-xs text-slate-400">
                    {post.author.member?.fullName ?? post.author.email}
                    <span className="mx-1.5">·</span>
                    {formatDate(post.createdAt)}
                    {post.isPublic && <span className="ml-1.5 text-primary-600">· Público</span>}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-slate-600">{post.content}</p>
                {post.eventDate && (
                  <p className="mt-1 text-xs text-primary-600">Encontro em {formatDate(post.eventDate)}</p>
                )}
              </div>
              {canManage(post) && (
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/mural/${post.id}`}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-primary-50 hover:text-primary-600"
                  >
                    <Edit2 size={13} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleArchive(post.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Archive size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-danger-50 hover:text-danger-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

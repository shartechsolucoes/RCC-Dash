"use client";

import { MessageSquare, Send, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";
import { hasAccess, MANAGEMENT_ROLES } from "@/lib/permissions";

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  author: { email: string; member: { fullName: string; photoUrl: string | null } | null };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MuralPage() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [canPost, setCanPost] = useState(false);

  function load() {
    apiFetch("/mural")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts);
  }

  useEffect(load, []);
  useEffect(() => {
    fetchMe().then((me) => setCanPost(hasAccess(me?.profileLevel, MANAGEMENT_ROLES)));
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await apiFetch("/mural", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: form.get("content"),
        imageUrl: form.get("imageUrl") || undefined,
      }),
    });

    if (response.ok) {
      (event.target as HTMLFormElement).reset();
      load();
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta postagem?")) return;
    await apiFetch(`/mural/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Mural</h1>

      {canPost && (
        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-100 p-5 sm:max-w-lg">
          <textarea
            name="content"
            required
            rows={3}
            placeholder="Compartilhe um aviso com a comunidade..."
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
          />
          <ImageUpload name="imageUrl" label="Imagem (opcional)" />
          <button
            type="submit"
            className="flex w-fit items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Send size={14} /> Publicar
          </button>
        </form>
      )}

      {posts === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {posts?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhuma postagem ainda.</p>}

      {posts && posts.length > 0 && (
        <div className="mt-6 flex flex-col gap-4 sm:max-w-lg">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-3 rounded-2xl border border-zinc-100 p-5">
              <div className="flex items-center gap-3">
                {post.author.member?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.member.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                    <MessageSquare size={14} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {post.author.member?.fullName ?? post.author.email}
                  </p>
                  <p className="text-xs text-zinc-400">{formatDate(post.createdAt)}</p>
                </div>
                {canPost && (
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <p className="whitespace-pre-line text-sm text-zinc-700">{post.content}</p>
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt="" className="max-h-72 w-full rounded-xl object-cover" />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

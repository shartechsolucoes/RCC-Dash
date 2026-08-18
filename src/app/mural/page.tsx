"use client";

import { MessageSquare, Send, Trash2, Edit2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";
import { hasAccess, MANAGEMENT_ROLES } from "@/lib/permissions";

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
  const [canPost, setCanPost] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  function load() {
    apiFetch("/mural")
      .then((res) => (res.ok ? res.json() : []))
      .then(setPosts);
  }

  useEffect(load, []);
  useEffect(() => {
    fetchMe().then((me) => setCanPost(hasAccess(me?.profileLevel, MANAGEMENT_ROLES)));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const body = JSON.stringify({
      title: form.get("title") || undefined,
      content: form.get("content"),
      eventDate: form.get("eventDate") ? new Date(form.get("eventDate") as string).toISOString() : undefined,
      imageUrl: form.get("imageUrl") || undefined,
      isPublic: form.get("isPublic") === "on",
    });

    const url = editingPost ? `/mural/${editingPost.id}` : "/mural";
    const method = editingPost ? "PUT" : "POST";

    const response = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      (event.target as HTMLFormElement).reset();
      setEditingPost(null);
      load();
    }
  }

  function handleCancelEdit() {
    setEditingPost(null);
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
        <form key={editingPost ? editingPost.id : "new"} onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-100 p-5 sm:max-w-lg">
          {editingPost && (
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-900">Editando postagem</span>
              <button type="button" onClick={handleCancelEdit} className="text-xs text-zinc-500 hover:text-zinc-900">Cancelar</button>
            </div>
          )}
          <input
            name="title"
            defaultValue={editingPost?.title ?? ""}
            placeholder="Título (opcional)"
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
          />
          <textarea
            name="content"
            required
            defaultValue={editingPost?.content ?? ""}
            rows={3}
            placeholder="Compartilhe um aviso com a comunidade..."
            className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Data do encontro (opcional)</span>
            <input
              type="datetime-local"
              name="eventDate"
              defaultValue={editingPost?.eventDate ? new Date(new Date(editingPost.eventDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""}
              className="rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
            />
          </div>
          <ImageUpload name="imageUrl" label="Imagem (opcional)" />
          <label className="flex items-center gap-2 text-sm text-zinc-600 font-medium cursor-pointer">
            <input type="checkbox" name="isPublic" defaultChecked={editingPost ? editingPost.isPublic : false} className="rounded border-zinc-300 text-amber-600 focus:ring-amber-600 h-4 w-4" />
            Publicar na tela inicial do site oficial (Público)
          </label>
          <button
            type="submit"
            className="flex w-fit items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Send size={14} /> {editingPost ? "Salvar alterações" : "Publicar"}
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
                  <p className="flex items-center gap-2 text-xs text-zinc-400">
                    {formatDate(post.createdAt)}
                    {post.isPublic && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">PÚBLICO</span>}
                  </p>
                </div>
                {canPost && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPost(post);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
              {post.title && <p className="text-base font-semibold text-zinc-900">{post.title}</p>}
              <p className="whitespace-pre-line text-sm text-zinc-700">{post.content}</p>
              {post.eventDate && <p className="text-xs font-medium text-amber-600">Data do encontro: {formatDate(post.eventDate)}</p>}
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

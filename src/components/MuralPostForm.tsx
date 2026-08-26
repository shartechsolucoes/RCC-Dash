"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

interface Post {
  id: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  eventDate: string | null;
  isPublic: boolean;
}

const inputClass =
  "rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-100";

export function MuralPostForm({ post, canPublish }: { post?: Post; canPublish: boolean }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const body = JSON.stringify({
      title: form.get("title") || undefined,
      content: form.get("content"),
      eventDate: form.get("eventDate") ? new Date(form.get("eventDate") as string).toISOString() : undefined,
      imageUrl: form.get("imageUrl") || undefined,
      isPublic: form.get("isPublic") === "on",
    });

    const url = post ? `/mural/${post.id}` : "/mural";
    const method = post ? "PUT" : "POST";

    const response = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    setSubmitting(false);

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar a postagem");
      return;
    }

    router.push("/mural");
  }

  return (
    <form onSubmit={handleSubmit} className="card flex max-w-lg flex-col gap-3.5">
      <input
        name="title"
        defaultValue={post?.title ?? ""}
        placeholder="Título (opcional)"
        className={inputClass}
      />
      <textarea
        name="content"
        required
        defaultValue={post?.content ?? ""}
        rows={4}
        placeholder="Compartilhe um aviso com a comunidade..."
        className={inputClass}
      />
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500">Data do encontro (opcional)</span>
        <input
          type="datetime-local"
          name="eventDate"
          defaultValue={
            post?.eventDate
              ? new Date(new Date(post.eventDate).getTime() - new Date().getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)
              : ""
          }
          className={inputClass}
        />
      </div>
      <ImageUpload name="imageUrl" label="Imagem (opcional)" defaultValue={post?.imageUrl} />
      {canPublish && (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={post?.isPublic ?? false}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Publicar na tela inicial do site oficial (Público)
        </label>
      )}
      {errorMessage && <p className="text-sm text-danger-600">{errorMessage}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex w-fit items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          <Send size={14} /> {submitting ? "Salvando..." : post ? "Salvar alterações" : "Publicar"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/mural")}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

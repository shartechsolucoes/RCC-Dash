"use client";

import { Image as ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface Gallery {
  id: string;
  title: string;
  photos: Photo[];
}

export default function GaleriaPage() {
  const [galleries, setGalleries] = useState<Gallery[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [photoFormId, setPhotoFormId] = useState<string | null>(null);

  function load() {
    apiFetch("/galleries")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGalleries);
  }

  useEffect(load, []);

  async function handleCreateGallery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await apiFetch("/galleries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.get("title") }),
    });

    if (response.ok) {
      setShowForm(false);
      load();
    }
  }

  async function handleAddPhoto(galleryId: string, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const response = await apiFetch(`/galleries/${galleryId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: form.get("url"), caption: form.get("caption") || undefined }),
    });

    if (response.ok) {
      setPhotoFormId(null);
      load();
    }
  }

  async function handleDeleteGallery(id: string) {
    if (!window.confirm("Excluir esta galeria e todas as fotos?")) return;
    await apiFetch(`/galleries/${id}`, { method: "DELETE" });
    load();
  }

  async function handleDeletePhoto(galleryId: string, photoId: string) {
    await apiFetch(`/galleries/${galleryId}/photos/${photoId}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Galeria</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Nova galeria"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateGallery} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5 sm:max-w-md">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Título
            <input name="title" required minLength={2} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <button type="submit" className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Criar galeria
          </button>
        </form>
      )}

      {galleries === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {galleries?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhuma galeria criada.</p>}

      {galleries && galleries.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {galleries.map((gallery) => (
            <div key={gallery.id} className="rounded-2xl border border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">{gallery.title}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPhotoFormId(photoFormId === gallery.id ? null : gallery.id)}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                  >
                    + Foto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGallery(gallery.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {photoFormId === gallery.id && (
                <form
                  onSubmit={(e) => handleAddPhoto(gallery.id, e)}
                  className="mt-3 flex flex-col gap-2 rounded-xl bg-zinc-50 p-3 sm:max-w-sm"
                >
                  <ImageUpload name="url" label="Foto" />
                  <input
                    name="caption"
                    placeholder="Legenda (opcional)"
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900"
                  />
                  <button type="submit" className="self-start rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white">
                    Adicionar
                  </button>
                </form>
              )}

              {gallery.photos.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">Nenhuma foto ainda.</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {gallery.photos.map((photo) => (
                    <div key={photo.id} className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pl-2 pr-1 text-xs text-zinc-600">
                      <ImageIcon size={12} />
                      <span className="max-w-[160px] truncate">{photo.caption || photo.url}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(gallery.id, photo.id)}
                        className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

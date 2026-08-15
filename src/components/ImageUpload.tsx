"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useState, type DragEvent } from "react";

import { apiFetch } from "@/lib/auth";

interface ImageUploadProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
  shape?: "square" | "circle";
}

export function ImageUpload({ name, label, defaultValue, shape = "square" }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch("/uploads", { method: "POST", body: formData });
    setUploading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.message ?? "Falha no upload");
      return;
    }

    const data = await response.json();
    setUrl(data.url);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-1 text-sm text-zinc-600">
      {label && <span>{label}</span>}
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className={`h-12 w-12 object-cover ${shape === "circle" ? "rounded-full" : "rounded-lg"}`}
          />
        ) : (
          <span
            className={`flex h-12 w-12 items-center justify-center bg-zinc-100 text-zinc-400 ${
              shape === "circle" ? "rounded-full" : "rounded-lg"
            }`}
          >
            <ImagePlus size={18} />
          </span>
        )}
        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            dragging
              ? "border-amber-500 bg-amber-50 text-amber-700"
              : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
          }`}
        >
          {uploading ? (
            <span className="flex items-center gap-1">
              <Loader2 size={13} className="animate-spin" /> Enviando...
            </span>
          ) : dragging ? (
            "Solte a imagem aqui"
          ) : url ? (
            "Trocar imagem (ou arraste)"
          ) : (
            "Escolher ou arrastar imagem"
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

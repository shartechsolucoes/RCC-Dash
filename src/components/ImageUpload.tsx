"use client";

import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { useState, type DragEvent } from "react";

import { apiFetch } from "@/lib/auth";

interface ImageUploadProps {
  name: string;
  label?: string;
  defaultValue?: string | null;
  shape?: "square" | "circle";
  disabled?: boolean;
}

export function ImageUpload({ name, label, defaultValue, shape = "square", disabled = false }: ImageUploadProps) {
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
    if (disabled) return;
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-2xl";

  return (
    <div className="flex flex-col gap-1.5 text-sm text-zinc-600">
      {label && <span>{label}</span>}
      <input type="hidden" name={name} value={url} />

      <label
        onDragOver={(event) => {
          if (disabled) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border-2 bg-zinc-50 text-zinc-400 shadow-sm ${shapeClass} ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        } ${dragging ? "border-amber-500" : "border-zinc-200"}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus size={26} />
        )}

        {!disabled && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-white transition-opacity ${
              dragging ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
            }`}
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <Camera size={20} />
                <span className="px-2 text-center text-[11px] font-medium leading-tight">
                  {dragging ? "Solte aqui" : url ? "Trocar foto" : "Enviar foto"}
                </span>
              </>
            )}
          </div>
        )}

        {!disabled && (
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
        )}
      </label>

      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

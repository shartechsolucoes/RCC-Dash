"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useState, type DragEvent } from "react";

interface Base64ImageInputProps {
  name: string;
  label?: string;
  required?: boolean;
  shape?: "square" | "circle";
  maxSizeMb?: number;
}

export function Base64ImageInput({
  name,
  label,
  required,
  shape = "circle",
  maxSizeMb = 4,
}: Base64ImageInputProps) {
  const [dataUrl, setDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem");
      return;
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`A imagem deve ter no máximo ${maxSizeMb}MB`);
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setDataUrl(reader.result as string);
      setLoading(false);
    };
    reader.onerror = () => {
      setError("Não foi possível ler a imagem");
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-1 text-sm text-zinc-600">
      {label && <span>{label}</span>}
      <input type="hidden" name={name} value={dataUrl} required={required} />
      <div className="flex items-center gap-3">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt=""
            className={`h-16 w-16 object-cover ${shape === "circle" ? "rounded-full" : "rounded-lg"}`}
          />
        ) : (
          <span
            className={`flex h-16 w-16 items-center justify-center bg-zinc-100 text-zinc-400 ${
              shape === "circle" ? "rounded-full" : "rounded-lg"
            }`}
          >
            <ImagePlus size={20} />
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
          {loading ? (
            <span className="flex items-center gap-1">
              <Loader2 size={13} className="animate-spin" /> Carregando...
            </span>
          ) : dragging ? (
            "Solte a foto aqui"
          ) : dataUrl ? (
            "Trocar foto (ou arraste)"
          ) : (
            "Escolher ou arrastar foto"
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
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

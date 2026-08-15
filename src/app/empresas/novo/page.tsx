"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { BRAZIL_STATES } from "@/lib/brazilStates";
import { ImageUpload } from "@/components/ImageUpload";
import { RichTextEditor } from "@/components/RichTextEditor";

const inputClass = "rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900";

export default function NovaEmpresaPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await apiFetch("/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        website: form.get("website") || undefined,
        logoUrl: form.get("logoUrl") || undefined,
        addressStreet: form.get("addressStreet") || undefined,
        addressNumber: form.get("addressNumber") || undefined,
        addressNeighborhood: form.get("addressNeighborhood") || undefined,
        addressCity: form.get("addressCity") || undefined,
        addressState: form.get("addressState") || undefined,
        addressZipCode: form.get("addressZipCode") || undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível criar a empresa");
      return;
    }

    const created = await response.json();
    router.push(`/empresas/${created.id}`);
  }

  return (
    <main className="px-8 py-8">
      <Link href="/empresas" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Empresas Amigas
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">Nova empresa</h1>

      <form onSubmit={handleCreate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
        <ImageUpload name="logoUrl" label="Logo" />
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Nome
          <input name="name" required minLength={2} className={inputClass} />
        </label>
        <RichTextEditor name="description" label="Descrição" />
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Site
          <input name="website" placeholder="https://" className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input name="addressStreet" placeholder="Rua" className={inputClass} />
          <input name="addressNumber" placeholder="Número" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="addressNeighborhood" placeholder="Bairro" className={inputClass} />
          <input name="addressCity" placeholder="Cidade" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select name="addressState" defaultValue="" className={inputClass}>
            <option value="">Estado</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s.uf} value={s.uf}>
                {s.name}
              </option>
            ))}
          </select>
          <input name="addressZipCode" placeholder="CEP" className={inputClass} />
        </div>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <div className="flex gap-2">
          <button type="submit" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Criar empresa
          </button>
          <Link href="/empresas" className="rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  );
}

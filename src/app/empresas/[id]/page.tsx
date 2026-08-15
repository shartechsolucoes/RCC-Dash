"use client";

import { Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { BRAZIL_STATES } from "@/lib/brazilStates";
import { ImageUpload } from "@/components/ImageUpload";
import { RichTextEditor } from "@/components/RichTextEditor";

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
}

const inputClass = "rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900";

export default function EmpresaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const companyId = params.id;

  const [company, setCompany] = useState<Company | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch("/companies")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: Company[]) => {
        const found = all.find((c) => c.id === companyId);
        if (found) setCompany(found);
        else setNotFound(true);
      });
  }

  useEffect(() => {
    if (!companyId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await apiFetch(`/companies/${companyId}`, {
      method: "PATCH",
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
      setErrorMessage("Não foi possível salvar as alterações");
      return;
    }

    load();
  }

  async function handleDelete() {
    if (!window.confirm("Excluir esta empresa?")) return;
    await apiFetch(`/companies/${companyId}`, { method: "DELETE" });
    router.push("/empresas");
  }

  if (notFound) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Empresa não encontrada.</p>
        <Link href="/empresas" className="mt-2 inline-block text-sm text-amber-700 hover:underline">
          ← Voltar
        </Link>
      </main>
    );
  }

  if (!company) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="px-8 py-8">
      <Link href="/empresas" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Empresas Amigas
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{company.name}</h1>
        <button
          type="button"
          onClick={handleDelete}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} /> Excluir
        </button>
      </div>

      <form onSubmit={handleUpdate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
        <ImageUpload name="logoUrl" label="Logo" defaultValue={company.logoUrl} />
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Nome
          <input name="name" defaultValue={company.name} required minLength={2} className={inputClass} />
        </label>
        <RichTextEditor name="description" label="Descrição" defaultValue={company.description} />
        <label className="flex flex-col gap-1 text-sm text-zinc-600">
          Site
          <input name="website" defaultValue={company.website ?? ""} className={inputClass} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input name="addressStreet" defaultValue={company.addressStreet ?? ""} placeholder="Rua" className={inputClass} />
          <input name="addressNumber" defaultValue={company.addressNumber ?? ""} placeholder="Número" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input name="addressNeighborhood" defaultValue={company.addressNeighborhood ?? ""} placeholder="Bairro" className={inputClass} />
          <input name="addressCity" defaultValue={company.addressCity ?? ""} placeholder="Cidade" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select name="addressState" defaultValue={company.addressState ?? ""} className={inputClass}>
            <option value="">Estado</option>
            {BRAZIL_STATES.map((s) => (
              <option key={s.uf} value={s.uf}>
                {s.name}
              </option>
            ))}
          </select>
          <input name="addressZipCode" defaultValue={company.addressZipCode ?? ""} placeholder="CEP" className={inputClass} />
        </div>
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        <button type="submit" className="flex items-center gap-1.5 self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
          <Save size={14} /> Salvar
        </button>
      </form>
    </main>
  );
}

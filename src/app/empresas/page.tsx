"use client";

import { Building2, ChevronRight, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface Company {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
}

function formatAddress(company: Company) {
  const line = [company.addressStreet, company.addressNumber].filter(Boolean).join(", ");
  const parts = [line, company.addressNeighborhood, company.addressCity, company.addressState, company.addressZipCode].filter(Boolean);
  return parts.join(" · ");
}

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[] | null>(null);

  function load() {
    apiFetch("/companies")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCompanies);
  }

  useEffect(load, []);

  async function handleDelete(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Excluir esta empresa?")) return;
    await apiFetch(`/companies/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Empresas Amigas</h1>
        <Link
          href="/empresas/novo"
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus size={16} />
          Nova empresa
        </Link>
      </div>

      {companies === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {companies?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhuma empresa cadastrada.</p>}

      {companies && companies.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/empresas/${company.id}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50"
            >
              {company.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Building2 size={16} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{company.name}</p>
                {company.website && <p className="truncate text-sm text-zinc-500">{company.website}</p>}
                {formatAddress(company) && <p className="truncate text-xs text-zinc-400">{formatAddress(company)}</p>}
              </div>
              <button
                type="button"
                onClick={(e) => handleDelete(company.id, e)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={15} />
              </button>
              <ChevronRight size={16} className="shrink-0 text-zinc-300" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

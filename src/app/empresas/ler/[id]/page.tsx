"use client";

import { Building2, Globe, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

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

function formatAddress(company: Company) {
  const line = [company.addressStreet, company.addressNumber].filter(Boolean).join(", ");
  const parts = [line, company.addressNeighborhood, company.addressCity, company.addressState, company.addressZipCode].filter(Boolean);
  return parts.join(" · ");
}

export default function LerEmpresaPage() {
  const params = useParams<{ id: string }>();
  const companyId = params.id;

  const [company, setCompany] = useState<Company | null | "not-found">(null);

  useEffect(() => {
    if (!companyId) return;
    apiFetch("/companies")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: Company[]) => {
        const found = all.find((c) => c.id === companyId);
        setCompany(found ?? "not-found");
      });
  }, [companyId]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 sm:px-8">
      <Link href="/empresas" className="text-sm text-slate-400 hover:text-slate-700">
        ← Empresas Amigas
      </Link>

      {company === null && <p className="text-sm text-slate-500">Carregando...</p>}
      {company === "not-found" && <p className="text-sm text-slate-500">Empresa não encontrada.</p>}

      {company && company !== "not-found" && (
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logoUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover ring-4 ring-primary-50" />
            ) : (
              <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600 ring-4 ring-primary-50">
                <Building2 size={28} />
              </span>
            )}

            <div className="flex min-w-0 flex-col gap-1">
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">{company.name}</h1>

              {company.website && (
                <a
                  href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary-600 hover:underline"
                >
                  <Globe size={14} /> {company.website.replace(/^https?:\/\//, "")}
                </a>
              )}

              {formatAddress(company) && (
                <p className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} className="shrink-0" /> {formatAddress(company)}
                </p>
              )}
            </div>
          </div>

          {company.description && (
            <div
              className="text-sm leading-6 text-slate-700 [&_a]:text-primary-600 [&_a]:underline [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: company.description }}
            />
          )}
        </div>
      )}
    </main>
  );
}

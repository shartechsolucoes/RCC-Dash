"use client";

import { Calendar, Compass, Mic2, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface Summary {
  membersTotal: number;
  eventsTotal: number;
  missionsTotal: number;
  ministriesTotal: number;
  registrations: { pending: number; approved: number; rejected: number; waitlist: number };
  financial: { income: number; expense: number; balance: number };
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function RelatoriosPage() {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    apiFetch("/reports/summary")
      .then((res) => (res.ok ? res.json() : null))
      .then(setSummary);
  }, []);

  if (!summary) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  const cards = [
    { title: "Membros", value: summary.membersTotal, icon: Users },
    { title: "Eventos", value: summary.eventsTotal, icon: Calendar },
    { title: "Missões", value: summary.missionsTotal, icon: Compass },
    { title: "Ministérios", value: summary.ministriesTotal, icon: Mic2 },
  ];

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Relatórios</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">{card.title}</span>
                <Icon size={16} className="text-zinc-400" />
              </div>
              <p className="mt-3 text-2xl font-semibold text-zinc-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-zinc-900">Inscrições por status</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Pendentes</p>
          <p className="mt-1 text-xl font-semibold text-amber-700">{summary.registrations.pending}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Aprovadas</p>
          <p className="mt-1 text-xl font-semibold text-green-700">{summary.registrations.approved}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Rejeitadas</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{summary.registrations.rejected}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Lista de espera</p>
          <p className="mt-1 text-xl font-semibold text-zinc-700">{summary.registrations.waitlist}</p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-zinc-900">Financeiro</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Entradas</p>
          <p className="mt-1 text-xl font-semibold text-green-700">{formatCurrency(summary.financial.income)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Saídas</p>
          <p className="mt-1 text-xl font-semibold text-red-700">{formatCurrency(summary.financial.expense)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 px-5 py-4">
          <p className="text-sm text-zinc-500">Saldo</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">{formatCurrency(summary.financial.balance)}</p>
        </div>
      </div>
    </main>
  );
}

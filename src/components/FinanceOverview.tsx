"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";
import { BarList, ChartCard, ColumnChart, SERIES, STATUS, StatTile, brl, plural } from "@/components/charts";

interface Transaction {
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: string | number;
  occurredAt: string;
}

interface RegistrationValue {
  eventId: string | null;
  status: string;
  totalAmount: number;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PROOF_SENT" | "PAID";
}

interface EventInfo {
  id: string;
  name: string;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// Painel geral do Financeiro: lançamentos (entradas/saídas) + valores das inscrições de todos os eventos.
export function FinanceOverview({ transactions }: { transactions: Transaction[] | null }) {
  const [registrations, setRegistrations] = useState<RegistrationValue[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);

  useEffect(() => {
    apiFetch("/registrations")
      .then((res) => (res.ok ? res.json() : []))
      .then(setRegistrations);
    apiFetch("/events")
      .then((res) => (res.ok ? res.json() : []))
      .then(setEvents);
  }, []);

  const list = transactions ?? [];
  const income = list.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = list.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);

  const payable = registrations.filter((r) => r.totalAmount > 0 && r.status !== "REJECTED");
  const open = payable.filter((r) => r.paymentStatus !== "PAID").reduce((s, r) => s + r.totalAmount, 0);
  const openCount = payable.filter((r) => r.paymentStatus !== "PAID").length;

  // Entradas x saídas por mês (só meses com movimento, em ordem).
  const months = new Map<string, [number, number]>();
  for (const t of list) {
    const d = new Date(t.occurredAt);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const entry = months.get(key) ?? [0, 0];
    entry[t.type === "INCOME" ? 0 : 1] += Number(t.amount);
    months.set(key, entry);
  }
  const monthColumns = [...months.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([key, values]) => {
      const [y, m] = key.split("-");
      return { label: `${MONTHS[Number(m) - 1]}/${y.slice(2)}`, values };
    });

  // Inscrições por evento: arrecadado x a receber.
  const byEvent = new Map<string, [number, number]>();
  for (const r of payable) {
    const key = r.eventId ?? "";
    const entry = byEvent.get(key) ?? [0, 0];
    entry[r.paymentStatus === "PAID" ? 0 : 1] += r.totalAmount;
    byEvent.set(key, entry);
  }
  const eventName = (id: string) => events.find((e) => e.id === id)?.name ?? "Sem evento";
  const eventRows = [...byEvent.entries()]
    .sort((a, b) => b[1][0] + b[1][1] - (a[1][0] + a[1][1]))
    .map(([id, values]) => ({ label: eventName(id), values }));

  // Entradas por categoria.
  const categories = new Map<string, number>();
  for (const t of list.filter((t) => t.type === "INCOME")) {
    categories.set(t.category, (categories.get(t.category) ?? 0) + Number(t.amount));
  }
  const categoryRows = [...categories.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, values: [value] }));

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Entradas" value={brl(income)} />
        <StatTile label="Saídas" value={brl(expense)} />
        <StatTile label="Saldo" value={brl(income - expense)} hint={income - expense < 0 ? "Saídas maiores que entradas" : undefined} />
        <StatTile
          label="A receber (inscrições)"
          value={brl(open)}
          hint={`${plural(openCount, "inscrição", "inscrições")} com pagamento em aberto`}
          tone={open > 0 ? "warning" : undefined}
        />
      </div>

      <ChartCard
        title="Entradas e saídas por mês"
        subtitle="Lançamentos do Financeiro (últimos 12 meses com movimento)"
        legend={[
          { label: "Entradas", color: SERIES[0] },
          { label: "Saídas", color: SERIES[1] },
        ]}
      >
        <ColumnChart
          columns={monthColumns}
          series={[
            { label: "Entradas", color: SERIES[0] },
            { label: "Saídas", color: SERIES[1] },
          ]}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Inscrições por evento"
          subtitle="Valor das inscrições com cobrança (sem as rejeitadas)"
          legend={[
            { label: "Arrecadado", color: STATUS.good },
            { label: "A receber", color: STATUS.warning },
          ]}
        >
          <BarList
            rows={eventRows}
            series={[
              { label: "Arrecadado", color: STATUS.good },
              { label: "A receber", color: STATUS.warning },
            ]}
          />
        </ChartCard>

        <ChartCard title="Entradas por categoria">
          <BarList rows={categoryRows} series={[{ label: "Entradas", color: SERIES[0] }]} />
        </ChartCard>
      </div>
    </div>
  );
}

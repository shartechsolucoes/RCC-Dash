"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";
import { BarList, ChartCard, ColumnChart, EmptyChart, SERIES, STATUS, SegmentBar, StatTile, brl, plural } from "@/components/charts";

type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PROOF_SENT" | "PAID";

interface RegistrationValue {
  id: string;
  fullName: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WAITLIST";
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  items: { name: string; option: string | null; unitPrice: number; quantity: number }[];
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  NOT_REQUIRED: "Sem valor",
  PENDING: "Pagamento pendente",
  PROOF_SENT: "Comprovante enviado",
  PAID: "Pago",
};

const dayKey = (iso: string) => new Date(iso).toLocaleDateString("sv-SE"); // AAAA-MM-DD local
const dayLabel = (key: string) => {
  const [, m, d] = key.split("-");
  return `${d}/${m}`;
};

// Painel de valores de um evento, calculado a partir das inscrições.
// Inscrições rejeitadas ficam de fora de todas as contas.
export function EventValues({ eventId }: { eventId: string }) {
  const [registrations, setRegistrations] = useState<RegistrationValue[] | null>(null);
  // "Agora" fixado na abertura da aba, para o "inscrito há N dias".
  const [now] = useState(() => Date.now());

  useEffect(() => {
    apiFetch(`/registrations?eventId=${eventId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRegistrations);
  }, [eventId]);

  if (registrations === null) return <p className="mt-6 text-sm text-zinc-500">Carregando...</p>;

  const payable = registrations.filter((r) => r.totalAmount > 0 && r.status !== "REJECTED");
  if (payable.length === 0) {
    return (
      <div className="mt-6 max-w-5xl">
        <EmptyChart text="Este evento ainda não tem inscrições com valor a pagar. Configure o valor e os itens na aba Inscrição e pagamento." />
      </div>
    );
  }

  const sumBy = (status: PaymentStatus) =>
    payable.filter((r) => r.paymentStatus === status).reduce((s, r) => s + r.totalAmount, 0);
  const paid = sumBy("PAID");
  const proof = sumBy("PROOF_SENT");
  const pending = sumBy("PENDING");
  const total = paid + proof + pending;
  const paidCount = payable.filter((r) => r.paymentStatus === "PAID").length;

  // Valor por linha de cobrança: taxa de inscrição + cada item/tamanho, separando pago de a receber.
  const lines = new Map<string, { paid: number; open: number; quantity: number }>();
  const add = (label: string, value: number, quantity: number, isPaid: boolean) => {
    const entry = lines.get(label) ?? { paid: 0, open: 0, quantity: 0 };
    if (isPaid) entry.paid += value;
    else entry.open += value;
    entry.quantity += quantity;
    lines.set(label, entry);
  };
  for (const r of payable) {
    const isPaid = r.paymentStatus === "PAID";
    const itemsValue = r.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const fee = Math.round((r.totalAmount - itemsValue) * 100) / 100;
    if (fee > 0) add("Inscrição", fee, 1, isPaid);
    for (const item of r.items) {
      add(item.option ? `${item.name} (${item.option})` : item.name, item.unitPrice * item.quantity, item.quantity, isPaid);
    }
  }
  const lineRows = [...lines.entries()]
    .sort((a, b) => b[1].paid + b[1].open - (a[1].paid + a[1].open))
    .map(([label, v]) => ({ label, values: [v.paid, v.open], note: `${v.quantity} un.` }));

  // Por dia: valor que entrou em inscrições (data da inscrição) x valor pago (data da confirmação).
  const days = new Map<string, [number, number]>();
  for (const r of payable) {
    const k = dayKey(r.createdAt);
    days.set(k, [(days.get(k)?.[0] ?? 0) + r.totalAmount, days.get(k)?.[1] ?? 0]);
    if (r.paymentStatus === "PAID" && r.paidAt) {
      const p = dayKey(r.paidAt);
      days.set(p, [days.get(p)?.[0] ?? 0, (days.get(p)?.[1] ?? 0) + r.totalAmount]);
    }
  }
  const dayColumns = [...days.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, values]) => ({ label: dayLabel(k), values }));

  const unpaid = payable
    .filter((r) => r.paymentStatus !== "PAID")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const daysSince = (iso: string) => Math.floor((now - new Date(iso).getTime()) / 86_400_000);

  return (
    <div className="mt-6 flex max-w-5xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Arrecadado" value={brl(paid)} hint={`${paidCount} de ${plural(payable.length, "inscrição paga", "inscrições pagas")}`} tone="good" />
        <StatTile label="A receber" value={brl(proof + pending)} hint={plural(payable.length - paidCount, "inscrição em aberto", "inscrições em aberto")} tone="warning" />
        <StatTile label="Ticket médio" value={brl(total / payable.length)} hint="por inscrição" />
        <StatTile label="Pago" value={`${Math.round((paid / total) * 100)}%`} hint={`de ${brl(total)} no total`} />
      </div>

      <ChartCard title="Situação dos pagamentos" subtitle="Valor de todas as inscrições com cobrança (sem as rejeitadas)">
        <SegmentBar
          parts={[
            { label: "Pago", value: paid, color: STATUS.good },
            { label: "Comprovante a conferir", value: proof, color: STATUS.info },
            { label: "Pagamento pendente", value: pending, color: STATUS.warning },
          ]}
        />
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Valor por item"
          subtitle="Inscrição e cada item/tamanho"
          legend={[
            { label: "Pago", color: STATUS.good },
            { label: "A receber", color: STATUS.warning },
          ]}
        >
          <BarList
            rows={lineRows}
            series={[
              { label: "Pago", color: STATUS.good },
              { label: "A receber", color: STATUS.warning },
            ]}
          />
        </ChartCard>

        <ChartCard
          title="Movimento por dia"
          subtitle="Valor inscrito (data da inscrição) e valor pago (data da confirmação)"
          legend={[
            { label: "Inscrito", color: SERIES[0] },
            { label: "Pago", color: STATUS.good },
          ]}
        >
          <ColumnChart
            columns={dayColumns}
            series={[
              { label: "Inscrito", color: SERIES[0] },
              { label: "Pago", color: STATUS.good },
            ]}
          />
        </ChartCard>
      </div>

      <ChartCard title={`Falta pagar (${unpaid.length})`} subtitle="Mais antigos primeiro">
        {unpaid.length === 0 ? (
          <EmptyChart text="Todas as inscrições com valor estão pagas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Nome</th>
                  <th className="py-2 pr-3 font-medium">Situação</th>
                  <th className="py-2 pr-3 text-right font-medium">Valor</th>
                  <th className="py-2 text-right font-medium">Inscrito há</th>
                </tr>
              </thead>
              <tbody>
                {unpaid.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-50">
                    <td className="py-2 pr-3 text-zinc-800">{r.fullName}</td>
                    <td className="py-2 pr-3">
                      <span className="flex items-center gap-1.5 text-zinc-600">
                        <span
                          aria-hidden
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: r.paymentStatus === "PROOF_SENT" ? STATUS.info : STATUS.warning }}
                        />
                        {PAYMENT_LABEL[r.paymentStatus]}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right text-zinc-900 tabular-nums">{brl(r.totalAmount)}</td>
                    <td className="py-2 text-right text-zinc-500 tabular-nums">
                      {daysSince(r.createdAt) === 0 ? "hoje" : `${daysSince(r.createdAt)} dia(s)`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

"use client";

import { useState } from "react";

// Primitivas de gráfico em HTML puro (sem biblioteca), seguindo a paleta de
// referência validada: categóricas em ordem fixa, status com rótulo, texto sempre
// em tinta neutra (nunca na cor da série), barras finas com ponta arredondada.

export const SERIES = ["#2a78d6", "#eb6834"] as const; // slots 1 e 2 (validados, modo claro)
export const STATUS = {
  good: "#0ca30c",
  warning: "#fab219",
  info: "#2a78d6",
  neutral: "#c3c2b7",
} as const;

export function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function brlShort(value: number) {
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  }
  return brl(value);
}

export function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-white px-5 py-4">
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
        {tone && (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: tone === "good" ? STATUS.good : STATUS.warning }}
          />
        )}
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  legend,
  children,
}: {
  title: string;
  subtitle?: string;
  legend?: { label: string; color: string }[];
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-100 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}
        </div>
        {legend && legend.length > 1 && (
          <ul className="flex flex-wrap gap-3 text-xs text-zinc-600">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyChart({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-zinc-400">{text}</p>;
}

// Barra única dividida em partes (ex.: pago / comprovante / pendente).
// Cada parte tem rótulo e valor ao lado — a cor nunca é a única pista.
export function SegmentBar({
  parts,
  format = brl,
}: {
  parts: { label: string; value: number; color: string }[];
  format?: (value: number) => string;
}) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const [hover, setHover] = useState<string | null>(null);
  if (total <= 0) return <EmptyChart text="Nada a mostrar ainda." />;

  return (
    <div>
      <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded" role="img" aria-label="Distribuição">
        {parts
          .filter((p) => p.value > 0)
          .map((p) => (
            <div
              key={p.label}
              onMouseEnter={() => setHover(p.label)}
              onMouseLeave={() => setHover(null)}
              title={`${p.label}: ${format(p.value)}`}
              className="h-full transition-opacity first:rounded-l last:rounded-r"
              style={{
                width: `${(p.value / total) * 100}%`,
                backgroundColor: p.color,
                opacity: hover && hover !== p.label ? 0.45 : 1,
              }}
            />
          ))}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {parts.map((p) => (
          <li
            key={p.label}
            onMouseEnter={() => setHover(p.label)}
            onMouseLeave={() => setHover(null)}
            className="flex items-start gap-2 text-sm"
          >
            <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.color }} />
            <span>
              <span className="block text-zinc-600">{p.label}</span>
              <span className="font-semibold text-zinc-900 tabular-nums">{format(p.value)}</span>
              <span className="ml-1 text-xs text-zinc-400">{total ? Math.round((p.value / total) * 100) : 0}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Barras horizontais (ranking por categoria). Uma ou duas séries empilhadas.
export function BarList({
  rows,
  series,
  format = brl,
}: {
  rows: { label: string; values: number[]; note?: string }[];
  series: { label: string; color: string }[];
  format?: (value: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0, ...rows.map((r) => r.values.reduce((s, v) => s + v, 0)));
  if (rows.length === 0 || max <= 0) return <EmptyChart text="Nada a mostrar ainda." />;

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row, index) => {
        const total = row.values.reduce((s, v) => s + v, 0);
        return (
          <li
            key={row.label}
            className="relative"
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-zinc-700">
                {row.label}
                {row.note && <span className="ml-1.5 text-xs text-zinc-400">{row.note}</span>}
              </span>
              <span className="shrink-0 font-medium text-zinc-900 tabular-nums">{format(total)}</span>
            </div>
            <div className="mt-1.5 flex h-2 gap-[2px]" style={{ width: `${(total / max) * 100}%` }}>
              {row.values.map((v, i) =>
                v > 0 ? (
                  <div
                    key={series[i].label}
                    className="h-full rounded-[4px]"
                    style={{ width: `${(v / total) * 100}%`, backgroundColor: series[i].color }}
                  />
                ) : null,
              )}
            </div>
            {hover === index && series.length > 1 && (
              <div className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-lg border border-zinc-100 bg-white px-3 py-2 text-xs shadow-lg">
                {series.map((s, i) => (
                  <p key={s.label} className="flex items-center gap-1.5 text-zinc-600">
                    <span aria-hidden className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                    {s.label}: <span className="font-medium text-zinc-900 tabular-nums">{format(row.values[i])}</span>
                  </p>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

// Colunas verticais ao longo do tempo (dia/mês). Uma ou duas séries lado a lado.
export function ColumnChart({
  columns,
  series,
  format = brl,
  height = 160,
}: {
  columns: { label: string; values: number[] }[];
  series: { label: string; color: string }[];
  format?: (value: number) => string;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0, ...columns.flatMap((c) => c.values));
  if (columns.length === 0 || max <= 0) return <EmptyChart text="Nada a mostrar ainda." />;

  // Rótulos do eixo: no máximo ~8, para não encavalar.
  const step = Math.max(1, Math.ceil(columns.length / 8));

  return (
    <div>
      <div className="relative flex items-end gap-1 border-b border-[#c3c2b7]" style={{ height }}>
        {/* linha de grade no topo (valor máximo) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-[#e1e0d9]" />
        <span className="pointer-events-none absolute -top-2 right-0 bg-white pl-1 text-[10px] text-[#898781] tabular-nums">
          {brlShort(max)}
        </span>
        {columns.map((col, index) => (
          <div
            key={col.label}
            className="relative flex h-full min-w-0 flex-1 items-end justify-center gap-[2px]"
            onMouseEnter={() => setHover(index)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === index && <div className="absolute inset-0 rounded bg-zinc-100/70" />}
            {col.values.map((v, i) => (
              <div
                key={series[i].label}
                className="relative w-full max-w-6 rounded-t-[4px]"
                style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0, backgroundColor: series[i].color }}
              />
            ))}
            {hover === index && (
              <div className="pointer-events-none absolute bottom-full z-10 mb-1 whitespace-nowrap rounded-lg border border-zinc-100 bg-white px-3 py-2 text-xs shadow-lg">
                <p className="font-medium text-zinc-900">{col.label}</p>
                {series.map((s, i) => (
                  <p key={s.label} className="flex items-center gap-1.5 text-zinc-600">
                    <span aria-hidden className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                    {series.length > 1 && `${s.label}: `}
                    <span className="font-medium text-zinc-900 tabular-nums">{format(col.values[i])}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        {columns.map((col, index) => (
          <span key={col.label} className="min-w-0 flex-1 truncate text-center text-[10px] text-[#898781]">
            {index % step === 0 ? col.label : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

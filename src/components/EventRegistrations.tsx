"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  BarChart3,
  ChevronDown,
  Circle,
  Clock,
  Copy,
  Download,
  FileText,
  ListPlus,
  Plus,
  Search,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { RequireRole } from "@/components/RequireRole";
import { MANAGEMENT_ROLES, TOP_ROLES, hasAccess } from "@/lib/permissions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "WAITLIST";

interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  photoUrl: string | null;
  status: Status;
  memberId: string | null;
  checkedInAt: string | null;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentProofUrl: string | null;
  paidAt: string | null;
  items: { name: string; option: string | null; unitPrice: number; quantity: number }[];
  createdAt: string;
  [key: string]: any;
}

interface EventInfo {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
}

interface EventSponsor {
  id: string;
  company: Company;
}

type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PROOF_SENT" | "PAID";

const PAYMENT_META: Record<PaymentStatus, { label: string; style: string }> = {
  NOT_REQUIRED: { label: "Sem valor", style: "bg-zinc-100 text-zinc-500" },
  PENDING: { label: "Pagamento pendente", style: "bg-amber-50 text-amber-700" },
  PROOF_SENT: { label: "Comprovante enviado", style: "bg-blue-50 text-blue-700" },
  PAID: { label: "Pago", style: "bg-green-50 text-green-700" },
};

function brl(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function itemLabel(item: { name: string; option: string | null }) {
  return item.option ? `${item.name} (${item.option})` : item.name;
}

function itemsSummary(f: Registration) {
  return f.items?.length ? f.items.map((i) => `${i.quantity}x ${itemLabel(i)}`).join(", ") : "—";
}

const STATUS_META: Record<Status, { label: string; style: string }> = {
  PENDING: { label: "Pendente", style: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Aprovada", style: "bg-green-50 text-green-700" },
  REJECTED: { label: "Rejeitada", style: "bg-red-50 text-red-600" },
  WAITLIST: { label: "Lista de espera", style: "bg-blue-50 text-blue-700" },
};

type FilterValue = Status | "ALL" | "PRESENCA";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "Pendentes", value: "PENDING" },
  { label: "Aprovadas", value: "APPROVED" },
  { label: "Rejeitadas", value: "REJECTED" },
  { label: "Lista de espera", value: "WAITLIST" },
  { label: "Todas", value: "ALL" },
  { label: "Lista de presença", value: "PRESENCA" },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function yesNo(value: unknown) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  return "—";
}

function text(value: unknown) {
  return value && typeof value === "string" ? value : "—";
}

function contact(name: unknown, phone: unknown) {
  return name || phone ? `${text(name)} — ${text(phone)}` : "—";
}

function sacramentos(f: Registration) {
  return (
    [
      f.sacramentoBatismo && "Batismo",
      f.sacramentoEucaristia && "Eucaristia",
      f.sacramentoCrisma && "Crisma",
      f.sacramentoNenhum && "Nenhum",
    ]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function withDetail(flag: unknown, detail: unknown) {
  return flag ? `Sim — ${text(detail)}` : "Não";
}

// Colunas da planilha de inscritos (mesmos dados da ficha expandida).
const REPORT_COLUMNS: { header: string; value: (f: Registration) => string }[] = [
  { header: "Nome", value: (f) => f.fullName },
  { header: "Nome no crachá", value: (f) => text(f.nomeCracha) },
  { header: "Status", value: (f) => STATUS_META[f.status].label },
  { header: "Presença", value: (f) => (f.checkedInAt ? "Presente" : "—") },
  { header: "Itens", value: itemsSummary },
  { header: "Total (R$)", value: (f) => (f.totalAmount ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) },
  { header: "Pagamento", value: (f) => PAYMENT_META[f.paymentStatus ?? "NOT_REQUIRED"].label },
  {
    header: "Pago em",
    value: (f) => (f.paidAt ? new Date(f.paidAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"),
  },
  { header: "Comprovante", value: (f) => f.paymentProofUrl ?? "—" },
  {
    header: "Data da inscrição",
    value: (f) => new Date(f.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
  },
  { header: "E-mail", value: (f) => f.email },
  { header: "Celular", value: (f) => f.phone ?? "—" },
  { header: "CPF", value: (f) => f.cpf ?? "—" },
  { header: "Sexo", value: (f) => text(f.sexo) },
  { header: "Data de nascimento", value: (f) => text(f.dataNascimento) },
  { header: "Instagram", value: (f) => text(f.instagram) },
  { header: "Rua", value: (f) => text(f.rua) },
  { header: "Número", value: (f) => text(f.numero) },
  { header: "Complemento", value: (f) => text(f.complemento) },
  { header: "Bairro", value: (f) => text(f.bairro) },
  { header: "Cidade", value: (f) => text(f.cidade) },
  { header: "Estado", value: (f) => text(f.estado) },
  { header: "CEP", value: (f) => text(f.cep) },
  { header: "Escolaridade", value: (f) => text(f.escolaridade) },
  { header: "Profissão", value: (f) => text(f.profissao) },
  { header: "Sacramentos", value: sacramentos },
  { header: "Já participou de movimento", value: (f) => withDetail(f.participouMovimento, f.quaisMovimentos) },
  { header: "Incentivado por", value: (f) => text(f.incentivadoPor) },
  { header: "Parente no encontro", value: (f) => withDetail(f.temParenteNoEncontro, f.nomeParentesco) },
  { header: "Motivo do encontro", value: (f) => text(f.motivoEncontro) },
  { header: "Medicamento contínuo", value: (f) => withDetail(f.usaMedicamentoContinuo, f.qualMedicamento) },
  { header: "Alergia a medicamentos", value: (f) => withDetail(f.temAlergiaMedicamento, f.quaisAlergiaMedicamento) },
  { header: "Alergia alimentar", value: (f) => withDetail(f.temAlergiaAlimentar, f.quaisAlergiaAlimentar) },
  { header: "Cuidado especial", value: (f) => withDetail(f.precisaCuidadoEspecial, f.qualCuidadoEspecial) },
  { header: "Casado(a)", value: (f) => (f.isCasado ? `Sim — ${text(f.nomeConjuge)} (${text(f.dataCasamento)})` : "Não") },
  { header: "Filhos", value: (f) => withDetail(f.temFilhos, f.idadesFilhos) },
  { header: "Emergência 1", value: (f) => contact(f.emergencia1Nome, f.emergencia1Telefone) },
  { header: "Emergência 2", value: (f) => contact(f.emergencia2Nome, f.emergencia2Telefone) },
  { header: "Emergência 3", value: (f) => contact(f.emergencia3Nome, f.emergencia3Telefone) },
];

// CSV com ";" e BOM UTF-8, que é o que o Excel em português abre direto com acentos.
function downloadCsv(filename: string, rows: Registration[]) {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = [
    REPORT_COLUMNS.map((c) => escape(c.header)).join(";"),
    ...rows.map((r) => REPORT_COLUMNS.map((c) => escape(c.value(r))).join(";")),
  ];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// O PDF é uma lista resumida (a planilha tem a ficha completa): cabe em A4 paisagem.
const PDF_COLUMNS = [
  "Nome",
  "Nome no crachá",
  "Status",
  "Presença",
  "Pagamento",
  "Celular",
  "E-mail",
  "Cidade",
  "Medicamento contínuo",
  "Alergia alimentar",
  "Emergência 1",
];

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// Abre uma janela de impressão; no diálogo do navegador o usuário escolhe "Salvar como PDF".
function printReport(
  title: string,
  subtitle: string,
  stats: { label: string; value: number }[],
  rows: Registration[],
) {
  const columns = REPORT_COLUMNS.filter((c) => PDF_COLUMNS.includes(c.header));
  const win = window.open("", "_blank");
  if (!win) {
    alert("Permita pop-ups deste site para gerar o PDF.");
    return;
  }
  win.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #18181b; margin: 0; font-size: 10px; }
  h1 { font-size: 16px; margin: 0; }
  .sub { color: #71717a; margin: 4px 0 12px; font-size: 11px; }
  .stats { display: flex; gap: 18px; margin-bottom: 12px; }
  .stats div { font-size: 10px; color: #71717a; }
  .stats strong { display: block; font-size: 15px; color: #18181b; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #e4e4e7; padding: 4px 5px; text-align: left; vertical-align: top; }
  th { background: #f4f4f5; font-size: 9px; text-transform: uppercase; letter-spacing: .02em; }
  tr { page-break-inside: avoid; }
  td.n { color: #a1a1aa; width: 22px; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p class="sub">${escapeHtml(subtitle)}</p>
<div class="stats">${stats.map((s) => `<div>${escapeHtml(s.label)}<strong>${s.value}</strong></div>`).join("")}</div>
<table><thead><tr><th>#</th>${columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join("")}</tr></thead>
<tbody>${rows
    .map(
      (r, i) =>
        `<tr><td class="n">${i + 1}</td>${columns.map((c) => `<td>${escapeHtml(c.value(r))}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table>
<script>window.onload = () => { window.print(); };</script>
</body></html>`);
  win.document.close();
}

// Comparação tolerante: ignora acentos, maiúsculas e espaços nas pontas
// (as cidades chegam digitadas de jeitos diferentes, ex. "Vila Velha ").
function normalize(value: unknown) {
  return typeof value === "string"
    ? value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ")
    : "";
}

function digits(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

type SortValue = "recentes" | "antigas" | "nome";

const SORTS: { label: string; value: SortValue }[] = [
  { label: "Mais recentes", value: "recentes" },
  { label: "Mais antigas", value: "antigas" },
  { label: "Nome (A–Z)", value: "nome" },
];

const SEXO_LABEL: Record<string, string> = { feminino: "Feminino", masculino: "Masculino" };

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className="text-sm text-zinc-800">{value}</dd>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</p>
      <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function PaymentDetails({
  registration: f,
  busy,
  onSetPaid,
}: {
  registration: Registration;
  busy: boolean;
  onSetPaid: (paid: boolean) => void;
}) {
  if (!f.totalAmount) return null;
  const meta = PAYMENT_META[f.paymentStatus];
  const fee = f.totalAmount - f.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Pagamento</p>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${meta.style}`}>{meta.label}</span>
      </div>
      <dl className="flex flex-col gap-1 text-sm">
        {fee > 0 && (
          <div className="flex justify-between">
            <dt className="text-zinc-500">Inscrição</dt>
            <dd className="text-zinc-800">{brl(fee)}</dd>
          </div>
        )}
        {f.items.map((item) => (
          <div key={itemLabel(item)} className="flex justify-between">
            <dt className="text-zinc-500">
              {item.quantity}x {itemLabel(item)}
            </dt>
            <dd className="text-zinc-800">{brl(item.unitPrice * item.quantity)}</dd>
          </div>
        ))}
        <div className="flex justify-between border-t border-zinc-100 pt-1 font-semibold">
          <dt className="text-zinc-900">Total</dt>
          <dd className="text-zinc-900">{brl(f.totalAmount)}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        {f.paymentProofUrl ? (
          <a
            href={f.paymentProofUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <FileText size={14} /> Ver comprovante
          </a>
        ) : (
          <span className="text-xs text-zinc-400">Comprovante ainda não enviado.</span>
        )}
        {f.paymentStatus === "PAID" ? (
          <>
            <span className="text-xs text-zinc-500">
              Pago em {f.paidAt ? new Date(f.paidAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—"}
            </span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetPaid(false)}
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Desfazer pagamento
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onSetPaid(true)}
            className="flex items-center gap-1.5 rounded-full bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> Confirmar pagamento
          </button>
        )}
      </div>
    </div>
  );
}

function RegistrationDetails({
  registration,
  paymentBusy,
  onSetPaid,
}: {
  registration: Registration;
  paymentBusy: boolean;
  onSetPaid: (paid: boolean) => void;
}) {
  const f = registration;

  return (
    <div className="flex flex-col gap-6 border-t border-zinc-50 bg-zinc-50/60 px-5 py-5">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
          {f.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <User size={22} />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{f.fullName}</p>
          <p className="text-xs text-zinc-500">Crachá: {text(f.nomeCracha)}</p>
        </div>
      </div>

      <PaymentDetails registration={f} busy={paymentBusy} onSetPaid={onSetPaid} />

      <DetailSection title="Dados pessoais">
        <Field label="Sexo" value={text(f.sexo)} />
        <Field label="Data de nascimento" value={text(f.dataNascimento)} />
        <Field label="CPF" value={f.cpf ?? "—"} />
        <Field label="Celular" value={f.phone ?? "—"} />
        <Field label="E-mail" value={f.email} />
        <Field label="Instagram" value={text(f.instagram)} />
      </DetailSection>

      <DetailSection title="Endereço">
        <Field label="Rua / Número" value={`${text(f.rua)}${f.numero ? `, ${f.numero}` : ""}`} />
        <Field label="Bairro" value={text(f.bairro)} />
        <Field label="Cidade" value={text(f.cidade)} />
        <Field label="CEP" value={text(f.cep)} />
      </DetailSection>

      <DetailSection title="Formação e profissão">
        <Field label="Escolaridade" value={text(f.escolaridade)} />
        <Field label="Profissão" value={text(f.profissao)} />
      </DetailSection>

      <DetailSection title="Vida de fé">
        <Field label="Sacramentos" value={sacramentos(f)} />
        <Field label="Já participou de movimento" value={yesNo(f.participouMovimento)} />
        {f.quaisMovimentos && <Field label="Quais movimentos" value={text(f.quaisMovimentos)} />}
        <Field label="Incentivado por" value={text(f.incentivadoPor)} />
        {f.nomeParentesco && <Field label="Parentesco no encontro" value={text(f.nomeParentesco)} />}
        <Field label="Motivo do encontro" value={text(f.motivoEncontro)} />
      </DetailSection>

      <DetailSection title="Saúde">
        <Field
          label="Medicamento contínuo"
          value={f.usaMedicamentoContinuo ? `Sim — ${text(f.qualMedicamento)}` : "Não"}
        />
        <Field
          label="Alergia a medicamentos"
          value={f.temAlergiaMedicamento ? `Sim — ${text(f.quaisAlergiaMedicamento)}` : "Não"}
        />
        <Field
          label="Alergia alimentar"
          value={f.temAlergiaAlimentar ? `Sim — ${text(f.quaisAlergiaAlimentar)}` : "Não"}
        />
        <Field
          label="Cuidado especial"
          value={f.precisaCuidadoEspecial ? `Sim — ${text(f.qualCuidadoEspecial)}` : "Não"}
        />
      </DetailSection>

      <DetailSection title="Situação familiar">
        <Field
          label="É casado(a)"
          value={f.isCasado ? `Sim — ${text(f.nomeConjuge)} (${text(f.dataCasamento)})` : "Não"}
        />
        <Field
          label="Tem filhos"
          value={
            f.temFilhos
              ? `Sim — idades: ${text(f.idadesFilhos)}`
              : "Não"
          }
        />
      </DetailSection>

      <DetailSection title="Contatos de emergência">
        <Field
          label="Contato 1"
          value={f.emergencia1Nome || f.emergencia1Telefone ? `${text(f.emergencia1Nome)} — ${text(f.emergencia1Telefone)}` : "—"}
        />
        <Field
          label="Contato 2"
          value={f.emergencia2Nome || f.emergencia2Telefone ? `${text(f.emergencia2Nome)} — ${text(f.emergencia2Telefone)}` : "—"}
        />
        <Field
          label="Contato 3"
          value={f.emergencia3Nome || f.emergencia3Telefone ? `${text(f.emergencia3Nome)} — ${text(f.emergencia3Telefone)}` : "—"}
        />
      </DetailSection>
    </div>
  );
}

export function EventRegistrations({ eventId, embedded = false }: { eventId: string; embedded?: boolean }) {

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [addingSponsor, setAddingSponsor] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [filter, setFilter] = useState<FilterValue>("PENDING");
  const [search, setSearch] = useState("");
  const [sexo, setSexo] = useState("");
  const [cidade, setCidade] = useState("");
  const [pagamento, setPagamento] = useState<PaymentStatus | "">("");
  const [payingId, setPayingId] = useState<string | null>(null);
  const [sort, setSort] = useState<SortValue>("recentes");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promotedInfo, setPromotedInfo] = useState<{ email: string; tempPassword: string } | null>(
    null,
  );
  const [canReport, setCanReport] = useState(false);

  useEffect(() => {
    fetchMe().then((me) => setCanReport(hasAccess(me?.profileLevel, TOP_ROLES)));
  }, []);

  function load() {
    apiFetch(`/registrations?eventId=${eventId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRegistrations);
  }

  function loadEvent() {
    apiFetch(`/events/${eventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setEvent(data);
        setSponsors(data?.sponsors ?? []);
      });
  }

  useEffect(() => {
    if (!eventId) return;
    loadEvent();
    load();
    apiFetch("/companies")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCompanies);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleAddSponsor() {
    if (!selectedCompanyId) return;
    setAddingSponsor(true);
    try {
      const response = await apiFetch(`/events/${eventId}/sponsors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: selectedCompanyId }),
      });
      if (response.ok) {
        setSelectedCompanyId("");
        loadEvent();
      }
    } finally {
      setAddingSponsor(false);
    }
  }

  async function handleRemoveSponsor(sponsorId: string) {
    await apiFetch(`/events/${eventId}/sponsors/${sponsorId}`, { method: "DELETE" });
    loadEvent();
  }

  async function handleStatusChange(id: string, status: Status) {
    await apiFetch(`/registrations/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function handlePromote(id: string) {
    setPromotingId(id);
    try {
      const response = await apiFetch(`/registrations/${id}/promote`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        alert(data?.message ?? "Não foi possível criar o usuário");
        return;
      }
      setPromotedInfo({ email: data.email, tempPassword: data.tempPassword });
      load();
    } finally {
      setPromotingId(null);
    }
  }

  async function handleSetPaid(id: string, paid: boolean) {
    if (!paid && !window.confirm("Desfazer o pagamento? A entrada no Financeiro também será removida.")) return;
    setPayingId(id);
    try {
      const response = await apiFetch(`/registrations/${id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.message ?? "Não foi possível atualizar o pagamento");
      }
      load();
    } finally {
      setPayingId(null);
    }
  }

  async function handleCheckIn(id: string, checkedIn: boolean) {
    setCheckingInId(id);
    try {
      await apiFetch(`/registrations/${id}/checkin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkedIn }),
      });
      load();
    } finally {
      setCheckingInId(null);
    }
  }

  function copyInviteLink() {
    const link = `${SITE_URL}/eventos/${eventId}/inscricao`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isPresenceView = filter === "PRESENCA";
  const byStatus =
    registrations?.filter((r) => {
      if (isPresenceView) return r.status === "APPROVED";
      return filter === "ALL" || r.status === filter;
    }) ?? [];

  // Opções de sexo/cidade a partir das próprias inscrições (cidade agrupada sem acento/caixa/espaços).
  const sexoOptions = [...new Set((registrations ?? []).map((r) => normalize(r.sexo)).filter(Boolean))].sort();
  const cidadeOptions = [
    ...(registrations ?? [])
      .reduce((map, r) => {
        const key = normalize(r.cidade);
        if (!key) return map;
        const entry = map.get(key) ?? { label: String(r.cidade).trim(), count: 0 };
        entry.count++;
        return map.set(key, entry);
      }, new Map<string, { label: string; count: number }>())
      .entries(),
  ].sort((a, b) => a[1].label.localeCompare(b[1].label, "pt-BR"));

  const searchText = normalize(search);
  const searchDigits = digits(search);
  const filtered = byStatus
    .filter((r) => !sexo || normalize(r.sexo) === sexo)
    .filter((r) => !cidade || normalize(r.cidade) === cidade)
    .filter((r) => !pagamento || r.paymentStatus === pagamento)
    .filter((r) => {
      if (!searchText) return true;
      const textMatch = [r.fullName, r.email, r.nomeCracha].some((v) => normalize(v).includes(searchText));
      const digitMatch = searchDigits.length >= 3 && [r.cpf, r.phone].some((v) => digits(v).includes(searchDigits));
      return textMatch || digitMatch;
    })
    .sort((a, b) => {
      if (sort === "nome") return a.fullName.localeCompare(b.fullName, "pt-BR");
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sort === "antigas" ? diff : -diff;
    });
  const presentCount = filtered.filter((r) => r.checkedInAt).length;
  const hasExtraFilters = Boolean(search || sexo || cidade || pagamento);
  const hasPayments = (registrations ?? []).some((r) => r.totalAmount > 0);

  function clearFilters() {
    setSearch("");
    setSexo("");
    setCidade("");
    setPagamento("");
  }

  // Descrição dos filtros ativos (vai no subtítulo do PDF).
  const filterDescription = [
    FILTERS.find((f) => f.value === filter)?.label,
    sexo && (SEXO_LABEL[sexo] ?? sexo),
    cidade && cidadeOptions.find(([key]) => key === cidade)?.[1].label,
    pagamento && PAYMENT_META[pagamento].label,
    search && `busca "${search.trim()}"`,
  ]
    .filter(Boolean)
    .join(" · ");

  const all = registrations ?? [];
  const approved = all.filter((r) => r.status === "APPROVED");
  const reportStats = [
    { label: "Total", value: all.length, style: "text-zinc-900" },
    { label: "Pendentes", value: all.filter((r) => r.status === "PENDING").length, style: "text-amber-700" },
    { label: "Aprovadas", value: approved.length, style: "text-green-700" },
    { label: "Rejeitadas", value: all.filter((r) => r.status === "REJECTED").length, style: "text-red-600" },
    { label: "Lista de espera", value: all.filter((r) => r.status === "WAITLIST").length, style: "text-blue-700" },
    { label: "Presentes", value: approved.filter((r) => r.checkedInAt).length, style: "text-blue-700" },
  ];
  // Quantidade pedida por item/tamanho (para encomendar kits). Rejeitadas não contam.
  const itemCounts = [
    ...all
      .filter((r) => r.status !== "REJECTED")
      .flatMap((r) => r.items ?? [])
      .reduce((map, item) => map.set(itemLabel(item), (map.get(itemLabel(item)) ?? 0) + item.quantity), new Map<string, number>()),
  ].sort((a, b) => a[0].localeCompare(b[0], "pt-BR"));

  // Rejeitadas não entram no "a receber".
  const paymentTotals = all.reduce(
    (acc, r) => {
      if (r.paymentStatus === "PAID") acc.paid += r.totalAmount;
      else if (r.totalAmount > 0 && r.status !== "REJECTED") acc.open += r.totalAmount;
      if (r.paymentStatus === "PROOF_SENT") acc.toReview++;
      return acc;
    },
    { paid: 0, open: 0, toReview: 0 },
  );
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label ?? "";

  function handleDownload() {
    const date = new Date().toLocaleDateString("sv-SE"); // AAAA-MM-DD no fuso local
    const name = slugify(event?.name ?? "evento") || "evento";
    // A planilha sai sempre em ordem de inscrição (mais antiga primeiro), seja qual for a ordem da tela.
    const byDate = [...filtered].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    downloadCsv(`inscricoes-${name}-${slugify(filterLabel)}-${date}.csv`, byDate);
  }

  function handlePrint() {
    const generatedAt = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    printReport(
      `Inscrições — ${event?.name ?? "Evento"}`,
      `Filtro: ${filterDescription} · ${filtered.length} inscrições · gerado em ${generatedAt}`,
      reportStats,
      filtered,
    );
  }

  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
      <div className={embedded ? "mt-6" : "px-8 py-8"}>
        {!embedded && (
          <Link href="/eventos" className="text-sm text-zinc-400 hover:text-zinc-700">
            ← Eventos
          </Link>
        )}
        <div className={`flex items-center justify-between gap-4 ${embedded ? "" : "mt-2"}`}>
          <div>
            {!embedded && (
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Inscrições {event ? `— ${event.name}` : ""}
              </h1>
            )}
            <p className="mt-1 text-sm text-zinc-500">
              Lista de presença do evento. Compartilhe o link de convite para receber inscrições.
            </p>
          </div>
          <button
            type="button"
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Copy size={16} />
            {copied ? "Link copiado!" : "Copiar link de convite"}
          </button>
        </div>

        {promotedInfo && (
          <div className="mt-6 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <span>
              Usuário criado para <strong>{promotedInfo.email}</strong>. Senha temporária:{" "}
              <code className="rounded bg-white/70 px-1.5 py-0.5">{promotedInfo.tempPassword}</code>
            </span>
            <button
              type="button"
              onClick={() => setPromotedInfo(null)}
              className="text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        )}

        {canReport && registrations !== null && (
          <section className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <BarChart3 size={14} />
                Relatório
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500">
                  {filterDescription} ({filtered.length})
                </span>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-50"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-400 disabled:opacity-50"
                >
                  <FileText size={14} />
                  PDF
                </button>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
              {reportStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs text-zinc-500">{stat.label}</dt>
                  <dd className={`text-xl font-semibold ${stat.style}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>
            {hasPayments && (
              <dl className="mt-3 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-3">
                <div>
                  <dt className="text-xs text-zinc-500">Arrecadado</dt>
                  <dd className="text-lg font-semibold text-green-700">{brl(paymentTotals.paid)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">A receber</dt>
                  <dd className="text-lg font-semibold text-amber-700">{brl(paymentTotals.open)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Comprovantes a conferir</dt>
                  <dd className="text-lg font-semibold text-blue-700">{paymentTotals.toReview}</dd>
                </div>
              </dl>
            )}
            {itemCounts.length > 0 && (
              <div className="mt-3 border-t border-zinc-100 pt-3">
                <p className="text-xs text-zinc-500">Itens pedidos (sem as rejeitadas)</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {itemCounts.map(([label, quantity]) => (
                    <span key={label} className="rounded-full bg-white px-2.5 py-1 text-xs text-zinc-700 ring-1 ring-zinc-200">
                      {label}: <strong>{quantity}</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f.value
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {f.label}
              {f.value === "PRESENCA" && <UserCheck size={12} className="ml-1 inline" />}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative min-w-56 flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, CPF, celular ou crachá"
              aria-label="Buscar inscrição"
              className="w-full rounded-full border border-zinc-200 py-1.5 pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
            />
          </label>
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            aria-label="Filtrar por sexo"
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700"
          >
            <option value="">Sexo: todos</option>
            {sexoOptions.map((s) => (
              <option key={s} value={s}>
                {SEXO_LABEL[s] ?? s}
              </option>
            ))}
          </select>
          <select
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            aria-label="Filtrar por cidade"
            className="max-w-52 rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700"
          >
            <option value="">Cidade: todas</option>
            {cidadeOptions.map(([key, { label, count }]) => (
              <option key={key} value={key}>
                {label} ({count})
              </option>
            ))}
          </select>
          {hasPayments && (
            <select
              value={pagamento}
              onChange={(e) => setPagamento(e.target.value as PaymentStatus | "")}
              aria-label="Filtrar por pagamento"
              className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700"
            >
              <option value="">Pagamento: todos</option>
              {(["PENDING", "PROOF_SENT", "PAID", "NOT_REQUIRED"] as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>
                  {PAYMENT_META[s].label}
                </option>
              ))}
            </select>
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            aria-label="Ordenar"
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {hasExtraFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            >
              <X size={13} /> Limpar filtros
            </button>
          )}
        </div>

        {registrations !== null && (
          <p className="mt-3 text-xs text-zinc-400">
            {filtered.length === byStatus.length
              ? `${filtered.length} inscriç${filtered.length === 1 ? "ão" : "ões"}`
              : `${filtered.length} de ${byStatus.length} inscrições`}
          </p>
        )}

        {isPresenceView && filtered.length > 0 && (
          <p className="mt-4 text-sm text-zinc-500">
            <strong className="text-zinc-900">{presentCount}</strong> de {filtered.length} presentes
          </p>
        )}

        {registrations === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}

        {registrations !== null && filtered.length === 0 && (
          <div className="mt-10 flex flex-col items-center gap-2 py-10 text-center text-sm text-zinc-500">
            <ListPlus size={22} className="text-zinc-300" />
            Nenhuma inscrição nesse filtro.
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
            {filtered.map((registration) => {
              const status = STATUS_META[registration.status];
              const expanded = expandedId === registration.id;
              return (
                <div key={registration.id}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                      {registration.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={registration.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : registration.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">{registration.fullName}</p>
                        <p className="truncate text-sm text-zinc-500">
                          {registration.email}
                          <span className="mx-1.5 text-zinc-300">·</span>
                          {formatDate(registration.createdAt)}
                        </p>
                      </div>
                      <ChevronDown size={14} className={`shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`} />
                    </button>
                    {registration.totalAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(registration.id)}
                        title={`${brl(registration.totalAmount)} — ver pagamento`}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_META[registration.paymentStatus].style}`}
                      >
                        {PAYMENT_META[registration.paymentStatus].label}
                      </button>
                    )}
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${status.style}`}>
                      {status.label}
                    </span>
                    {registration.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(registration.id, "APPROVED")}
                          className="flex shrink-0 items-center gap-1.5 rounded-full bg-green-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                        >
                          <CheckCircle2 size={14} />
                          Aprovar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(registration.id, "REJECTED")}
                          className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <XCircle size={14} />
                          Rejeitar
                        </button>
                      </>
                    )}
                    {registration.status !== "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(registration.id, "PENDING")}
                        className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                      >
                        <Clock size={14} />
                        Pendente
                      </button>
                    )}
                    {registration.status === "APPROVED" && (
                      <button
                        type="button"
                        disabled={checkingInId === registration.id}
                        onClick={() => handleCheckIn(registration.id, !registration.checkedInAt)}
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          registration.checkedInAt
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "border border-blue-200 text-blue-700 hover:bg-blue-50"
                        }`}
                      >
                        {registration.checkedInAt ? <UserCheck size={14} /> : <Circle size={14} />}
                        {registration.checkedInAt ? "Presente" : "Marcar presença"}
                      </button>
                    )}
                    {registration.status === "APPROVED" &&
                      (registration.memberId ? (
                        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-500">
                          <CheckCircle2 size={14} />
                          Já é usuário
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={promotingId === registration.id}
                          onClick={() => handlePromote(registration.id)}
                          className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                        >
                          <UserPlus size={14} />
                          {promotingId === registration.id ? "Criando..." : "Virar usuário"}
                        </button>
                      ))}
                  </div>

                  {expanded && (
                    <RegistrationDetails
                      registration={registration}
                      paymentBusy={payingId === registration.id}
                      onSetPaid={(paid) => handleSetPaid(registration.id, paid)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Empresas parceiras</p>

          <div className="mt-3 flex gap-2">
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm text-zinc-900"
            >
              <option value="">Selecione uma empresa cadastrada</option>
              {companies
                .filter((c) => !sponsors.some((s) => s.company.id === c.id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              disabled={!selectedCompanyId || addingSponsor}
              onClick={handleAddSponsor}
              className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              <Plus size={16} />
              {addingSponsor ? "Adicionando..." : "Adicionar"}
            </button>
          </div>

          {sponsors.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">Nenhuma empresa parceira vinculada a este evento.</p>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
              {sponsors.map((sponsor) => (
                <div key={sponsor.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                    {sponsor.company.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sponsor.company.logoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Building2 size={16} />
                    )}
                  </span>
                  <p className="flex-1 text-sm text-zinc-800">{sponsor.company.name}</p>
                  <button
                    type="button"
                    onClick={() => handleRemoveSponsor(sponsor.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          <Calendar size={14} />
          Envie o link de convite para os interessados preencherem a inscrição deste evento.
        </div>
      </div>
    </RequireRole>
  );
}

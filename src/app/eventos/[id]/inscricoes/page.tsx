"use client";

import {
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Copy,
  ListPlus,
  Plus,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";
import { RequireRole } from "@/components/RequireRole";
import { MANAGEMENT_ROLES } from "@/lib/permissions";

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
  createdAt: string;
  formData: Record<string, unknown> | null;
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

function RegistrationDetails({ registration }: { registration: Registration }) {
  const f = (registration.formData ?? {}) as Record<string, any>;
  const endereco = f.endereco ?? {};
  const sacramentos = f.sacramentos ?? {};
  const medicamentoContinuo = f.medicamentoContinuo ?? {};
  const alergiaMedicamento = f.alergiaMedicamento ?? {};
  const alergiaAlimentar = f.alergiaAlimentar ?? {};
  const cuidadoEspecial = f.cuidadoEspecial ?? {};
  const pai = f.pai ?? {};
  const mae = f.mae ?? {};
  const casado = f.casado ?? {};
  const temFilhos = f.temFilhos ?? {};
  const contatosEmergencia: { nome?: string; telefone?: string }[] = Array.isArray(f.contatosEmergencia)
    ? f.contatosEmergencia
    : [];

  return (
    <div className="flex flex-col gap-6 border-t border-zinc-50 bg-zinc-50/60 px-5 py-5">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
          {registration.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={registration.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <User size={22} />
          )}
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{registration.fullName}</p>
          <p className="text-xs text-zinc-500">Crachá: {text(f.nomeCracha)}</p>
        </div>
      </div>

      <DetailSection title="Dados pessoais">
        <Field label="Sexo" value={text(f.sexo)} />
        <Field label="Data de nascimento" value={text(f.dataNascimento)} />
        <Field label="CPF" value={registration.cpf ?? "—"} />
        <Field label="Celular" value={registration.phone ?? "—"} />
        <Field label="E-mail" value={registration.email} />
        <Field label="Instagram" value={text(f.instagram)} />
      </DetailSection>

      <DetailSection title="Endereço">
        <Field label="Rua / Número" value={`${text(endereco.rua)}${endereco.numero ? `, ${endereco.numero}` : ""}`} />
        <Field label="Bairro" value={text(endereco.bairro)} />
        <Field label="Cidade" value={text(endereco.cidade)} />
        <Field label="CEP" value={text(endereco.cep)} />
      </DetailSection>

      <DetailSection title="Formação e profissão">
        <Field label="Escolaridade" value={text(f.escolaridade)} />
        <Field label="Profissão" value={text(f.profissao)} />
      </DetailSection>

      <DetailSection title="Vida de fé">
        <Field
          label="Sacramentos"
          value={
            [
              sacramentos.batismo && "Batismo",
              sacramentos.eucaristia && "Eucaristia",
              sacramentos.crisma && "Crisma",
              sacramentos.nenhum && "Nenhum",
            ]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />
        <Field label="Já participou de movimento" value={yesNo(f.participouMovimento)} />
        {f.quaisMovimentos && <Field label="Quais movimentos" value={text(f.quaisMovimentos)} />}
        <Field label="Incentivado por" value={text(f.incentivadoPor)} />
        {f.nomeParentesco && <Field label="Parentesco no encontro" value={text(f.nomeParentesco)} />}
        <Field label="Motivo do encontro" value={text(f.motivoEncontro)} />
      </DetailSection>

      <DetailSection title="Saúde">
        <Field
          label="Medicamento contínuo"
          value={medicamentoContinuo.usa ? `Sim — ${text(medicamentoContinuo.qual)}` : "Não"}
        />
        <Field
          label="Alergia a medicamentos"
          value={alergiaMedicamento.tem ? `Sim — ${text(alergiaMedicamento.quais)}` : "Não"}
        />
        <Field
          label="Alergia alimentar"
          value={alergiaAlimentar.tem ? `Sim — ${text(alergiaAlimentar.quais)}` : "Não"}
        />
        <Field
          label="Cuidado especial"
          value={cuidadoEspecial.precisa ? `Sim — ${text(cuidadoEspecial.qual)}` : "Não"}
        />
      </DetailSection>

      <DetailSection title="Situação familiar">
        <Field
          label="É casado(a)"
          value={casado.sim ? `Sim — ${text(casado.nomeConjuge)} (${text(casado.dataCasamento)})` : "Não"}
        />
        <Field
          label="Tem filhos"
          value={
            temFilhos.sim
              ? `Sim — idades: ${text(temFilhos.idades)}${
                  temFilhos.levaraParaKids ? ` · Kids: ${temFilhos.levaraParaKids}` : ""
                }`
              : "Não"
          }
        />
      </DetailSection>

      <DetailSection title="Contatos de emergência">
        {contatosEmergencia.map((contato, index) => (
          <Field
            key={index}
            label={`Contato ${index + 1}`}
            value={contato.nome || contato.telefone ? `${text(contato.nome)} — ${text(contato.telefone)}` : "—"}
          />
        ))}
      </DetailSection>
    </div>
  );
}

export default function EventoInscricoesPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [sponsors, setSponsors] = useState<EventSponsor[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [addingSponsor, setAddingSponsor] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [registrations, setRegistrations] = useState<Registration[] | null>(null);
  const [filter, setFilter] = useState<FilterValue>("PENDING");
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [promotedInfo, setPromotedInfo] = useState<{ email: string; tempPassword: string } | null>(
    null,
  );

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
    const link = `${window.location.origin}/eventos/${eventId}/inscricao`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const isPresenceView = filter === "PRESENCA";
  const filtered =
    registrations?.filter((r) => {
      if (isPresenceView) return r.status === "APPROVED";
      return filter === "ALL" || r.status === filter;
    }) ?? [];
  const presentCount = filtered.filter((r) => r.checkedInAt).length;

  return (
    <RequireRole roles={MANAGEMENT_ROLES}>
      <main className="px-8 py-8">
        <Link href="/eventos" className="text-sm text-zinc-400 hover:text-zinc-700">
          ← Eventos
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Inscrições {event ? `— ${event.name}` : ""}
            </h1>
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

                  {expanded && <RegistrationDetails registration={registration} />}
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
      </main>
    </RequireRole>
  );
}

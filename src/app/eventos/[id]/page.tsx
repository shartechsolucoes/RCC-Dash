"use client";

import { Calendar, MapPin, Save, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";
import { EventRegistrationSettings } from "@/components/EventRegistrationSettings";
import { EventRegistrations } from "@/components/EventRegistrations";
import { EventValues } from "@/components/EventValues";
import { EventTeamsSection } from "@/components/EventTeamsSection";
import { TOP_ROLES, hasAccess } from "@/lib/permissions";

type EventTab = "evento" | "inscritos" | "valores" | "inscricao" | "equipes";

interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  location: string | null;
  groupId: string | null;
  group: { id: string; name: string } | null;
  startDate: string;
  endDate: string;
}

interface GroupOption {
  id: string;
  name: string;
}

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [registrationCount, setRegistrationCount] = useState<number | null>(null);
  const [tab, setTab] = useState<EventTab>("evento");
  // Inscritos e Valores só são montadas (e carregam dados) depois de abertas uma vez.
  const [openedTabs, setOpenedTabs] = useState<Set<EventTab>>(() => new Set(["evento"]));

  function openTab(next: EventTab) {
    setTab(next);
    setOpenedTabs((current) => (current.has(next) ? current : new Set(current).add(next)));
  }

  function load() {
    apiFetch(`/events/${eventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setEvent(data);
        else setNotFound(true);
      });
  }

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  useEffect(() => {
    if (!eventId) return;
    load();
    apiFetch("/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (!eventId || user?.profileLevel === "MEMBRO") return;
    apiFetch(`/registrations?eventId=${eventId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown[]) => setRegistrationCount(data.length));
  }, [eventId, user?.profileLevel]);

  async function handleUpdate(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    const form = new FormData(formEvent.currentTarget);

    const response = await apiFetch(`/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        coverImageUrl: form.get("coverImageUrl") || undefined,
        location: form.get("location") || undefined,
        groupId: form.get("groupId") || null,
        startDate: new Date(String(form.get("startDate"))).toISOString(),
        endDate: new Date(String(form.get("endDate"))).toISOString(),
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar as alterações");
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    setSuccessMessage("Evento salvo com sucesso!");
    setTimeout(() => setSuccessMessage(null), 5000);
    load();
  }

  if (notFound) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Evento não encontrado.</p>
        <Link href="/eventos" className="mt-2 inline-block text-sm text-amber-700 hover:underline">
          ← Voltar
        </Link>
      </main>
    );
  }

  if (!event || !user) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  const isMembro = user.profileLevel === "MEMBRO";
  const canConfigureRegistration = hasAccess(user.profileLevel, TOP_ROLES);
  const tabs: { key: EventTab; label: string }[] = [
    { key: "evento", label: "Evento" },
    ...(!isMembro
      ? [{ key: "inscritos" as const, label: `Inscritos${registrationCount !== null ? ` (${registrationCount})` : ""}` }]
      : []),
    ...(canConfigureRegistration
      ? [
          { key: "valores" as const, label: "Valores" },
          { key: "inscricao" as const, label: "Inscrição e pagamento" },
        ]
      : []),
    { key: "equipes", label: "Equipes" },
  ];

  return (
    <main className="px-8 py-8">
      <Link href="/eventos" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Eventos
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{event.name}</h1>
        {!isMembro && tab !== "inscritos" && (
          <button
            type="button"
            onClick={() => openTab("inscritos")}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Users size={14} /> Inscrições
            {registrationCount !== null && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-xs font-semibold text-primary-700">
                {registrationCount}
              </span>
            )}
          </button>
        )}
      </div>

      <div role="tablist" aria-label="Seções do evento" className="mt-5 flex max-w-3xl gap-1 border-b border-zinc-100">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => openTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* As abas ficam montadas (só escondidas) para não perder o que foi digitado ao trocar de aba. */}
      <div role="tabpanel" hidden={tab !== "evento"}>
      {isMembro ? (
        <div className="mt-6 grid max-w-3xl gap-6 rounded-2xl border border-zinc-100 p-5 sm:grid-cols-[220px_1fr]">
          {event.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.coverImageUrl} alt="" className="h-full max-h-56 w-full rounded-xl object-cover" />
          ) : (
            <div className="flex h-40 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-violet-50 sm:h-full sm:max-h-56">
              <Calendar size={32} className="text-primary-300" />
            </div>
          )}

          <div className="flex flex-col gap-4">
            {event.description && <p className="text-sm text-zinc-700">{event.description}</p>}
            <div className="flex items-center gap-2 text-sm text-zinc-600">
              <Calendar size={15} className="shrink-0 text-zinc-400" />
              {formatDateTime(event.startDate)} — {formatDateTime(event.endDate)}
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <MapPin size={15} className="shrink-0 text-zinc-400" />
                {event.location}
              </div>
            )}
            {event.group && (
              <div className="flex items-center gap-2 text-sm text-zinc-600">
                <Users size={15} className="shrink-0 text-zinc-400" />
                {event.group.name}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="mt-6 flex max-w-3xl flex-col gap-6 rounded-2xl border border-zinc-100 p-5 sm:flex-row sm:items-start">
          <div className="shrink-0">
            <ImageUpload name="coverImageUrl" label="Capa" defaultValue={event.coverImageUrl} />
          </div>

          <div className="flex flex-1 flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Nome
              <input name="name" defaultValue={event.name} required minLength={3} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Descrição
              <textarea name="description" defaultValue={event.description ?? ""} rows={3} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Local
              <input name="location" defaultValue={event.location ?? ""} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Fraternidade responsável
              <select name="groupId" defaultValue={event.groupId ?? ""} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
                <option value="">—</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                Início
                <input
                  type="datetime-local"
                  name="startDate"
                  defaultValue={toLocalInputValue(event.startDate)}
                  required
                  className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
                />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                Fim
                <input
                  type="datetime-local"
                  name="endDate"
                  defaultValue={toLocalInputValue(event.endDate)}
                  required
                  className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
                />
              </label>
            </div>

            {errorMessage && <p className="text-sm text-red-600 font-medium">{errorMessage}</p>}
            {successMessage && <p className="text-sm text-green-600 font-medium bg-green-50 p-2 rounded border border-green-200">{successMessage}</p>}

            <button type="submit" className="flex items-center gap-1.5 self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              <Save size={14} /> Salvar
            </button>
          </div>
        </form>
      )}
      </div>

      {!isMembro && openedTabs.has("inscritos") && (
        <div role="tabpanel" hidden={tab !== "inscritos"}>
          <EventRegistrations eventId={eventId} embedded />
        </div>
      )}

      {canConfigureRegistration && openedTabs.has("valores") && (
        <div role="tabpanel" hidden={tab !== "valores"}>
          <EventValues eventId={eventId} />
        </div>
      )}

      {canConfigureRegistration && (
        <div role="tabpanel" hidden={tab !== "inscricao"}>
          <EventRegistrationSettings eventId={eventId} />
        </div>
      )}

      <div role="tabpanel" hidden={tab !== "equipes"}>
        <EventTeamsSection eventId={eventId} isMembro={isMembro} />
      </div>
    </main>
  );
}

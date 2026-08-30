"use client";

import { Bell, ChevronRight, MapPin, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";

interface EventItem {
  id: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  location: string | null;
  groupId: string | null;
  group: { id: string; name: string } | null;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

function dateParts(value: string) {
  const date = new Date(value);
  return {
    weekday: date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
    day: date.toLocaleDateString("pt-BR", { day: "2-digit" }),
    month: date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function EventosPage() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [pendingByEvent, setPendingByEvent] = useState<Record<string, number>>({});
  const [user, setUser] = useState<CurrentUser | null>(null);

  function load() {
    apiFetch("/events")
      .then((res) => (res.ok ? res.json() : []))
      .then(setEvents);

    apiFetch("/registrations")
      .then((res) => (res.ok ? res.json() : []))
      .then((registrations: { eventId: string | null; status: string }[]) => {
        const counts: Record<string, number> = {};
        for (const registration of registrations) {
          if (registration.eventId && registration.status === "PENDING") {
            counts[registration.eventId] = (counts[registration.eventId] ?? 0) + 1;
          }
        }
        setPendingByEvent(counts);
      });
  }

  useEffect(load, []);
  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  const isMembro = user?.profileLevel === "MEMBRO";

  async function handleDelete(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Excluir este evento?")) return;
    await apiFetch(`/events/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Eventos</h1>
        {!isMembro && (
          <Link
            href="/eventos/novo"
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus size={16} />
            Novo evento
          </Link>
        )}
      </div>

      {events === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}

      {events?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhum evento cadastrado.</p>}

      {events && events.length > 0 && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {events.map((event) => {
            const { weekday, day, month } = dateParts(event.startDate);
            return (
              <div
                key={event.id}
                className="group relative flex gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/eventos/${event.id}`} aria-label={event.name} className="absolute inset-0 z-10" />

                {/* Calendar block */}
                <div className="flex w-16 shrink-0 flex-col overflow-hidden rounded-xl border border-zinc-100 shadow-sm">
                  <span className="bg-danger-500 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-white">
                    {weekday}
                  </span>
                  <span className="flex flex-1 flex-col items-center justify-center bg-white py-1.5">
                    <span className="text-2xl font-black leading-none text-zinc-900">{day}</span>
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      {month}
                    </span>
                  </span>
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-900">{event.name}</p>
                    {!event.isActive && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                    <span>{formatTime(event.startDate)}</span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-zinc-400" />
                        {event.location}
                      </span>
                    )}
                    {event.group && <span>· {event.group.name}</span>}
                  </p>

                  <div className="mt-auto flex items-center justify-between pt-2">
                    <Link
                      href={`/eventos/${event.id}/inscricoes`}
                      className="relative z-20 flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100"
                      title={
                        pendingByEvent[event.id]
                          ? `${pendingByEvent[event.id]} inscrição(ões) pendente(s)`
                          : "Inscrições e link de convite"
                      }
                    >
                      <Users size={13} />
                      Inscrições
                      {pendingByEvent[event.id] > 0 && (
                        <span className="flex h-4 min-w-4 items-center justify-center gap-0.5 rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
                          <Bell size={9} />
                          {pendingByEvent[event.id]}
                        </span>
                      )}
                    </Link>
                    <div className="flex items-center gap-1">
                      {!isMembro && (
                        <button
                          type="button"
                          onClick={(e) => handleDelete(event.id, e)}
                          className="relative z-20 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                      <ChevronRight size={16} className="pointer-events-none shrink-0 text-zinc-300" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

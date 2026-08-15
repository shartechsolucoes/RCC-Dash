"use client";

import { Bell, Calendar, ChevronRight, Plus, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EventosPage() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [pendingByEvent, setPendingByEvent] = useState<Record<string, number>>({});

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
        <Link
          href="/eventos/novo"
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Plus size={16} />
          Novo evento
        </Link>
      </div>

      {events === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}

      {events?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhum evento cadastrado.</p>}

      {events && events.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventos/${event.id}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                {event.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.coverImageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Calendar size={16} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {event.name}
                  {!event.isActive && (
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Inativo
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-zinc-500">
                  {formatDate(event.startDate)}
                  {event.location ? ` · ${event.location}` : ""}
                  {event.group ? ` · ${event.group.name}` : ""}
                </p>
              </div>
              <span
                onClick={(e) => e.stopPropagation()}
                className="relative"
              >
                <Link
                  href={`/eventos/${event.id}/inscricoes`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                  title={
                    pendingByEvent[event.id]
                      ? `${pendingByEvent[event.id]} inscrição(ões) pendente(s)`
                      : "Inscrições e link de convite"
                  }
                >
                  <Users size={15} />
                </Link>
                {pendingByEvent[event.id] > 0 && (
                  <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center gap-0.5 rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                    <Bell size={9} />
                    {pendingByEvent[event.id]}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={(e) => handleDelete(event.id, e)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
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

"use client";

import { Calendar, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { RequireRole } from "@/components/RequireRole";
import { TOP_ROLES } from "@/lib/permissions";

interface CalendarEntry {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function CalendarioPage() {
  const [entries, setEntries] = useState<CalendarEntry[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch("/calendar")
      .then((res) => (res.ok ? res.json() : []))
      .then(setEntries);
  }

  useEffect(load, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const startAt = form.get("startAt");
    const endAt = form.get("endAt");

    const response = await apiFetch("/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        description: form.get("description") || undefined,
        startAt: new Date(String(startAt)).toISOString(),
        endAt: endAt ? new Date(String(endAt)).toISOString() : undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível criar a marcação");
      return;
    }

    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir esta marcação?")) return;
    await apiFetch(`/calendar/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <RequireRole roles={TOP_ROLES}>
      <main className="px-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-black">Calendário</h1>
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancelar" : "Nova marcação"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5 sm:max-w-md">
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Título
              <input name="title" required minLength={2} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Observações
              <textarea name="description" rows={2} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <div className="flex gap-2">
              <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                Início
                <input type="datetime-local" name="startAt" required defaultValue={toLocalInputValue(new Date())} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-600">
                Fim (opcional)
                <input type="datetime-local" name="endAt" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
              </label>
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <button type="submit" className="mt-1 w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              Salvar
            </button>
          </form>
        )}

        {entries === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
        {entries?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhum compromisso cadastrado.</p>}

        {entries && entries.length > 0 && (
          <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Calendar size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">{entry.title}</p>
                  <p className="text-sm text-zinc-500">
                    {formatDate(entry.startAt)}
                    {entry.description ? ` · ${entry.description}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </RequireRole>
  );
}

"use client";

import { Save, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

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

export default function EventoDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const eventId = params.id;

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function load() {
    apiFetch(`/events/${eventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setEvent(data);
        else setNotFound(true);
      });
  }

  useEffect(() => {
    if (!eventId) return;
    load();
    apiFetch("/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

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

  async function handleDelete() {
    if (!window.confirm("Excluir este evento?")) return;
    await apiFetch(`/events/${eventId}`, { method: "DELETE" });
    router.push("/eventos");
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

  if (!event) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="px-8 py-8">
      <Link href="/eventos" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Eventos
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{event.name}</h1>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/eventos/${eventId}/inscricoes`}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Users size={14} /> Inscrições
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Excluir
          </button>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
        <ImageUpload name="coverImageUrl" label="Capa" defaultValue={event.coverImageUrl} />
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
      </form>
    </main>
  );
}

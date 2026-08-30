"use client";

import { Layers, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";

interface TeamType {
  id: string;
  groupId: string | null;
  name: string;
  description: string | null;
  color: string | null;
  order: number;
  isActive: boolean;
  group: { id: string; name: string } | null;
}

const inputClass =
  "rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";

/**
 * Gerencia o catálogo de tipos de equipe.
 * - Sem groupId: tipos globais (usados em todos os eventos).
 * - Com groupId: mostra os tipos globais (somente leitura) + os da fraternidade,
 *   que podem ser criados/editados/removidos aqui.
 */
export function TeamTypesManager({
  groupId,
  canManage,
}: {
  groupId?: string;
  canManage: boolean;
}) {
  const [types, setTypes] = useState<TeamType[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listPath = groupId ? `/team-types?groupId=${groupId}` : "/team-types?scope=global";

  function load() {
    apiFetch(listPath)
      .then((res) => (res.ok ? res.json() : []))
      .then(setTypes);
  }

  useEffect(load, [listPath]);

  function isOwn(type: TeamType) {
    return groupId ? type.groupId === groupId : type.groupId === null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = {
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || undefined,
      color: String(form.get("color") ?? "").trim() || undefined,
      order: Number(form.get("order") ?? 0),
    };
    if (!editingId && groupId) payload.groupId = groupId;

    const res = await apiFetch(editingId ? `/team-types/${editingId}` : "/team-types", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.message ?? "Não foi possível salvar");
      return;
    }

    setShowForm(false);
    setEditingId(null);
    load();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este tipo de equipe?")) return;
    const res = await apiFetch(`/team-types/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  const editing = types?.find((t) => t.id === editingId) ?? null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Tipos de equipe {types ? `(${types.length})` : ""}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setShowForm((v) => !v);
            }}
            className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
          >
            <Plus size={12} /> Novo tipo
          </button>
        )}
      </div>

      {canManage && (showForm || editingId) && (
        <form onSubmit={submit} className="mt-3 grid gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 sm:grid-cols-2">
          <input name="name" required minLength={2} defaultValue={editing?.name ?? ""} placeholder="Nome (ex.: Cozinha, Música)" className={inputClass} />
          <input name="order" type="number" defaultValue={editing?.order ?? 0} placeholder="Ordem" className={inputClass} />
          <input name="color" defaultValue={editing?.color ?? ""} placeholder="Cor (opcional, #f59e0b)" className={inputClass} />
          <input name="description" defaultValue={editing?.description ?? ""} placeholder="Descrição (opcional)" className={inputClass} />
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-amber-400">
              <Save size={14} /> Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setError(null);
              }}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        </form>
      )}

      {types === null && <p className="mt-2 text-sm text-zinc-500">Carregando...</p>}
      {types && types.length === 0 && <p className="mt-2 text-sm text-zinc-500">Nenhum tipo de equipe.</p>}

      {types && types.length > 0 && (
        <div className="mt-3 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {types.map((type) => {
            const own = isOwn(type);
            return (
              <div key={type.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500"
                  style={{ backgroundColor: type.color ?? "#f4f4f5" }}
                >
                  <Layers size={14} />
                </span>
                <div className="flex-1">
                  <p className="text-sm text-zinc-800">{type.name}</p>
                  {type.description && <p className="text-xs text-zinc-400">{type.description}</p>}
                </div>
                {!own && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Global</span>
                )}
                {!type.isActive && (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-500">Inativo</span>
                )}
                {canManage && own && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingId(type.id);
                      }}
                      className="text-zinc-400 hover:text-zinc-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => remove(type.id)} className="text-zinc-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

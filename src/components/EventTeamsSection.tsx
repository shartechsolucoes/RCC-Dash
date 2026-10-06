"use client";

import { RotateCcw, Trash2, UserMinus, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface Person {
  id: string;
  fullName: string;
  photoUrl: string | null;
}

interface TeamType {
  id: string;
  name: string;
  color: string | null;
}

// As equipes do evento são montadas por quem gerencia o evento (coordenação geral /
// root / coordenador da fraternidade): coordenador + membros. Não há inscrição em equipe.
interface EventTeam {
  id: string;
  name: string;
  teamType: TeamType | null;
  coordinatorId: string | null;
  coordinator: Person | null;
  members: Person[];
  isMember: boolean;
  canManage: boolean;
  canRemove: boolean;
}

interface RemovedTeam {
  id: string;
  name: string;
  teamType: TeamType | null;
}

function Avatar({ person, size = "h-8 w-8" }: { person: Person | null; size?: string }) {
  return (
    <span
      title={person?.fullName}
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500`}
    >
      {person?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Users size={14} />
      )}
    </span>
  );
}

function TeamDot({ teamType, faded = false }: { teamType: TeamType | null; faded?: boolean }) {
  return (
    <span
      className={`h-2.5 w-2.5 shrink-0 rounded-full ${faded ? "opacity-50" : ""}`}
      style={{ backgroundColor: teamType?.color ?? "#d4d4d8" }}
    />
  );
}

export function EventTeamsSection({
  eventId,
  isMembro,
}: {
  eventId: string;
  isMembro: boolean;
}) {
  const [teams, setTeams] = useState<EventTeam[] | null>(null);
  const [removedTeams, setRemovedTeams] = useState<RemovedTeam[]>([]);
  const [members, setMembers] = useState<Person[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = teams?.some((t) => t.canManage) ?? false;

  const load = useCallback(() => {
    apiFetch(`/events/${eventId}/teams`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setTeams);
    // Só quem gerencia o evento recebe a lista; para os demais a API responde 403.
    if (!isMembro) {
      apiFetch(`/events/${eventId}/teams/removed`)
        .then((res) => (res.ok ? res.json() : []))
        .then(setRemovedTeams)
        .catch(() => setRemovedTeams([]));
    }
  }, [eventId, isMembro]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!canManage) return;
    apiFetch("/members")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Person[]) => setMembers(data))
      .catch(() => setMembers([]));
  }, [canManage]);

  // Executa uma escrita da equipe, mostra o erro da API se houver e recarrega.
  async function run(teamId: string, path: string, init: RequestInit, fallbackError: string) {
    setBusyId(teamId);
    try {
      const response = await apiFetch(`/events/${eventId}/teams/${teamId}${path}`, init);
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.message ?? fallbackError);
      }
      load();
    } finally {
      setBusyId(null);
    }
  }

  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  function setCoordinator(teamId: string, coordinatorId: string | null) {
    return run(teamId, "", json("PATCH", { coordinatorId }), "Não foi possível atribuir o coordenador");
  }

  function addMember(teamId: string, memberId: string) {
    return run(teamId, "/members", json("POST", { memberId }), "Não foi possível adicionar o membro");
  }

  function removeMember(teamId: string, person: Person) {
    if (!window.confirm(`Tirar ${person.fullName} da equipe?`)) return;
    return run(teamId, `/members/${person.id}`, { method: "DELETE" }, "Não foi possível tirar o membro");
  }

  function removeTeam(team: EventTeam) {
    if (!window.confirm(`Remover a equipe "${team.name}" deste evento?`)) return;
    return run(team.id, "", { method: "DELETE" }, "Não foi possível remover a equipe");
  }

  function restoreTeam(teamId: string) {
    return run(teamId, "/restore", { method: "POST" }, "Não foi possível adicionar a equipe de volta");
  }

  return (
    <section className="mt-8 max-w-3xl">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Equipes {teams ? `(${teams.length})` : ""}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        As equipes são montadas pelo coordenador da fraternidade responsável: coordenador e membros de cada uma.
      </p>

      {teams === null && <p className="mt-4 text-sm text-zinc-500">Carregando...</p>}
      {teams && teams.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          Nenhuma equipe. As equipes vêm dos <strong>tipos de equipe</strong>: os globais
          (Administração → Tipos de equipe) e os cadastrados na fraternidade responsável pelo evento.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {teams?.map((team) => {
          const busy = busyId === team.id;
          const available = members.filter((m) => !team.members.some((tm) => tm.id === m.id));
          return (
            <div key={team.id} className="rounded-2xl border border-zinc-100 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <TeamDot teamType={team.teamType} />
                <p className="flex-1 text-sm font-semibold text-zinc-900">{team.name}</p>
                {team.isMember && (
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                    Você está nesta equipe
                  </span>
                )}
                {team.canRemove && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => removeTeam(team)}
                    className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-zinc-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 size={13} /> Remover do evento
                  </button>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                Coordenador:
                {team.canManage ? (
                  <select
                    value={team.coordinatorId ?? ""}
                    disabled={busy}
                    onChange={(e) => setCoordinator(team.id, e.target.value || null)}
                    aria-label={`Coordenador da equipe ${team.name}`}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-800 disabled:opacity-50"
                  >
                    <option value="">— sem coordenador —</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-zinc-800">{team.coordinator?.fullName ?? "—"}</span>
                )}
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Membros ({team.members.length})
                </p>
                {team.members.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-400">Nenhum membro atribuído.</p>
                ) : (
                  <div className="mt-2 flex flex-col divide-y divide-zinc-50">
                    {team.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 py-1.5">
                        <Avatar person={m} />
                        <Link href={`/membros/${m.id}`} className="flex-1 text-sm text-zinc-800 hover:underline">
                          {m.fullName}
                        </Link>
                        {team.canManage && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeMember(team.id, m)}
                            className="flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <UserMinus size={12} /> Tirar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {team.canManage && (
                  <select
                    value=""
                    disabled={busy || available.length === 0}
                    onChange={(e) => e.target.value && addMember(team.id, e.target.value)}
                    aria-label={`Adicionar membro à equipe ${team.name}`}
                    className="mt-2 w-full rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 disabled:opacity-50"
                  >
                    <option value="">+ Adicionar membro…</option>
                    {available.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isMembro && removedTeams.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
            Equipes removidas deste evento ({removedTeams.length})
          </p>
          <div className="mt-2 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-dashed border-zinc-200">
            {removedTeams.map((team) => (
              <div key={team.id} className="flex items-center gap-2 px-4 py-2.5">
                <TeamDot teamType={team.teamType} faded />
                <p className="flex-1 text-sm text-zinc-500">{team.name}</p>
                <button
                  type="button"
                  disabled={busyId === team.id}
                  onClick={() => restoreTeam(team.id)}
                  className="flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50"
                >
                  <RotateCcw size={12} /> Adicionar de volta
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

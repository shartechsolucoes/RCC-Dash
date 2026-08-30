"use client";

import { Check, Clock, UserMinus, Users, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface Person {
  id: string;
  fullName: string;
  photoUrl: string | null;
}

interface TeamRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  member: Person;
}

interface ApprovedMember extends Person {
  isActive: boolean;
}

interface EventTeam {
  id: string;
  name: string;
  teamType: { id: string; name: string; color: string | null } | null;
  coordinatorId: string | null;
  coordinator: Person | null;
  capacity: number | null;
  activeMembers: number;
  isFull: boolean;
  members: ApprovedMember[];
  requests: TeamRequest[];
  myRequest: TeamRequest | null;
  isMember: boolean;
  canManage: boolean;
}

const STATUS_META: Record<TeamRequest["status"], { label: string; style: string }> = {
  PENDING: { label: "Aguardando", style: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Aceito", style: "bg-green-50 text-green-700" },
  REJECTED: { label: "Não aceito", style: "bg-red-50 text-red-600" },
};

function StackedAvatars({ people, max = 5 }: { people: Person[]; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p) => (
        <span
          key={p.id}
          title={p.fullName}
          className="-ml-2 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-zinc-100 text-[10px] font-semibold text-zinc-500 first:ml-0"
        >
          {p.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            p.fullName.slice(0, 1).toUpperCase()
          )}
        </span>
      ))}
      {rest > 0 && (
        <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-zinc-200 text-[10px] font-semibold text-zinc-600">
          +{rest}
        </span>
      )}
    </div>
  );
}

function MemberTeamCard({
  team,
  busy,
  onJoin,
  onCancel,
}: {
  team: EventTeam;
  busy: boolean;
  onJoin: () => void;
  onCancel: () => void;
}) {
  const color = team.teamType?.color ?? "#a1a1aa";
  const activeList = team.members.filter((m) => m.isActive);
  const pct =
    team.capacity && team.capacity > 0
      ? Math.min(100, Math.round((team.activeMembers / team.capacity) * 100))
      : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="h-1.5" style={{ backgroundColor: color }} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-zinc-900">{team.name}</p>
            {team.coordinator && (
              <p className="mt-0.5 text-xs text-zinc-400">Coord.: {team.coordinator.fullName}</p>
            )}
          </div>
          {team.isMember ? (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
              <Check size={12} /> Participando
            </span>
          ) : team.myRequest ? (
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_META[team.myRequest.status].style}`}>
              {STATUS_META[team.myRequest.status].label}
            </span>
          ) : team.isFull ? (
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-400">Lotada</span>
          ) : null}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold leading-none text-zinc-900">{team.activeMembers}</p>
            <p className="mt-1 text-xs text-zinc-500">
              inscrito{team.activeMembers === 1 ? "" : "s"}
              {team.capacity != null ? ` de ${team.capacity} vaga${team.capacity === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          {activeList.length > 0 && <StackedAvatars people={activeList} />}
        </div>

        {pct != null && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: team.isFull ? "#dc2626" : color }}
            />
          </div>
        )}

        <div className="mt-auto pt-1">
          {team.isMember ? (
            <p className="text-xs text-zinc-400">Você faz parte desta equipe.</p>
          ) : team.myRequest?.status === "PENDING" ? (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancelar inscrição
            </button>
          ) : team.isFull ? (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-400"
            >
              Vagas preenchidas
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={onJoin}
              className="w-full rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-900 transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {team.myRequest?.status === "REJECTED" ? "Inscrever-se novamente" : "Inscrever-se"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ person }: { person: Person }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Users size={14} />
      )}
    </span>
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
  const [members, setMembers] = useState<Person[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch(`/events/${eventId}/teams`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setTeams);
  }, [eventId]);

  useEffect(load, [load]);

  useEffect(() => {
    apiFetch("/members")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Person[]) => setMembers(data))
      .catch(() => setMembers([]));
  }, []);

  async function patchTeam(teamId: string, body: Record<string, unknown>) {
    await apiFetch(`/events/${eventId}/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  async function join(teamId: string) {
    setBusyId(teamId);
    try {
      await apiFetch(`/events/${eventId}/teams/${teamId}/requests`, { method: "POST" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function cancel(teamId: string) {
    setBusyId(teamId);
    try {
      await apiFetch(`/events/${eventId}/teams/${teamId}/requests/me`, { method: "DELETE" });
      load();
    } finally {
      setBusyId(null);
    }
  }

  async function decide(teamId: string, requestId: string, status: "APPROVED" | "REJECTED") {
    await apiFetch(`/events/${eventId}/teams/${teamId}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function removeMember(teamId: string, memberId: string) {
    if (!window.confirm("Remover esta pessoa da equipe?")) return;
    await apiFetch(`/events/${eventId}/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(teamId: string, memberId: string, isActive: boolean) {
    await apiFetch(`/events/${eventId}/teams/${teamId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    load();
  }

  return (
    <section className="mt-8 max-w-3xl">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Equipes {teams ? `(${teams.length})` : ""}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Equipes pré-cadastradas pela fraternidade responsável. Cada evento tem sua própria formação.
      </p>

      {teams === null && <p className="mt-4 text-sm text-zinc-500">Carregando...</p>}
      {teams && teams.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500">
          Nenhuma equipe. As equipes vêm dos <strong>tipos de equipe</strong>: os globais
          (Administração → Tipos de equipe) e os cadastrados na fraternidade responsável pelo evento.
          Cadastre ao menos um tipo para as equipes aparecerem aqui.
        </p>
      )}

      {isMembro && teams && teams.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {teams.map((team) => (
            <MemberTeamCard
              key={team.id}
              team={team}
              busy={busyId === team.id}
              onJoin={() => join(team.id)}
              onCancel={() => cancel(team.id)}
            />
          ))}
        </div>
      )}

      {!isMembro && (
      <div className="mt-4 flex flex-col gap-4">
        {teams?.map((team) => {
          const pending = team.requests.filter((r) => r.status === "PENDING");
          const decided = team.requests.filter((r) => r.status !== "PENDING");
          return (
            <div key={team.id} className="rounded-2xl border border-zinc-100 p-4">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: team.teamType?.color ?? "#d4d4d8" }}
                />
                <p className="flex-1 text-sm font-semibold text-zinc-900">{team.name}</p>
              </div>

              {team.canManage ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
                  <label className="flex items-center gap-2">
                    Coordenador da equipe:
                    <select
                      value={team.coordinatorId ?? ""}
                      onChange={(e) => patchTeam(team.id, { coordinatorId: e.target.value || null })}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-800"
                    >
                      <option value="">— sem coordenador —</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    Vagas:
                    <input
                      type="number"
                      min={0}
                      defaultValue={team.capacity ?? ""}
                      placeholder="ilimitado"
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        const next = v === "" ? null : Math.max(0, Number(v));
                        if (next !== team.capacity) patchTeam(team.id, { capacity: next });
                      }}
                      className="w-24 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-800"
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-zinc-500">
                  {team.coordinator && <span>Coordenador: {team.coordinator.fullName}</span>}
                  {team.capacity != null && (
                    <span className={team.isFull ? "text-red-600" : ""}>
                      {team.activeMembers}/{team.capacity} vagas
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  Integrantes ({team.activeMembers} ativo{team.activeMembers === 1 ? "" : "s"} de {team.members.length}
                  {team.capacity != null ? ` · ${team.capacity} vagas` : ""})
                </p>
                {team.members.length === 0 ? (
                  <p className="mt-1 text-sm text-zinc-400">Ninguém ainda.</p>
                ) : (
                  <div className="mt-2 flex flex-col divide-y divide-zinc-50">
                    {team.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2 py-1.5">
                        <Avatar person={m} />
                        <Link
                          href={`/membros/${m.id}`}
                          className={`flex-1 text-sm hover:underline ${m.isActive ? "text-zinc-800" : "text-zinc-400 line-through"}`}
                        >
                          {m.fullName}
                        </Link>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            m.isActive ? "bg-green-50 text-green-700" : "bg-zinc-100 text-zinc-500"
                          }`}
                        >
                          {m.isActive ? "Ativo" : "Inativo"}
                        </span>
                        {team.canManage && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleActive(team.id, m.id, !m.isActive)}
                              className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                            >
                              {m.isActive ? "Inativar" : "Ativar"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeMember(team.id, m.id)}
                              className="flex items-center gap-1 rounded-full border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              <UserMinus size={12} /> Remover
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {team.canManage && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                    Pedidos ({pending.length} pendente{pending.length === 1 ? "" : "s"})
                  </p>
                  {team.requests.length === 0 ? (
                    <p className="mt-1 text-sm text-zinc-400">Nenhum pedido.</p>
                  ) : (
                    <div className="mt-2 flex flex-col divide-y divide-zinc-50">
                      {[...pending, ...decided].map((r) => (
                        <div key={r.id} className="flex items-center gap-2 py-1.5">
                          <Avatar person={r.member} />
                          <Link href={`/membros/${r.member.id}`} className="flex-1 text-sm text-zinc-800 hover:underline">
                            {r.member.fullName}
                          </Link>
                          {r.status === "PENDING" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => decide(team.id, r.id, "APPROVED")}
                                className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                              >
                                <Check size={12} /> Aceitar
                              </button>
                              <button
                                type="button"
                                onClick={() => decide(team.id, r.id, "REJECTED")}
                                className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <X size={12} /> Recusar
                              </button>
                            </>
                          ) : (
                            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${STATUS_META[r.status].style}`}>
                              {r.status === "APPROVED" ? <Check size={12} /> : <Clock size={12} />}
                              {STATUS_META[r.status].label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
    </section>
  );
}

"use client";

import { Bell, ChevronRight, Plus, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { BRAZIL_STATES } from "@/lib/brazilStates";
import { ImageUpload } from "@/components/ImageUpload";

interface Group {
  id: string;
  type: "MISSION" | "MINISTRY" | "TEAM";
  name: string;
  description: string | null;
  photoUrl: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  missionId: string | null;
  ministryId: string | null;
  coordinatorId: string | null;
  coordinator: { id: string; fullName: string; photoUrl: string | null } | null;
  mission: { id: string; name: string } | null;
  ministry: { id: string; name: string } | null;
  isActive: boolean;
  _count: { members: number };
}

interface GroupRequest {
  id: string;
  groupId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface Option {
  id: string;
  name: string;
}

interface MemberOption {
  id: string;
  fullName: string;
}

const REQUEST_STATUS_META: Record<GroupRequest["status"], { label: string; style: string }> = {
  PENDING: { label: "Pendente", style: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Aprovado", style: "bg-green-50 text-green-700" },
  REJECTED: { label: "Recusado", style: "bg-red-50 text-red-600" },
};

const inputClass = "rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900";

function formatAddress(group: Pick<Group, "addressStreet" | "addressNumber" | "addressNeighborhood" | "addressCity" | "addressState" | "addressZipCode">) {
  const line = [group.addressStreet, group.addressNumber].filter(Boolean).join(", ");
  const parts = [line, group.addressNeighborhood, group.addressCity, group.addressState, group.addressZipCode].filter(Boolean);
  return parts.join(" · ");
}

export default function FraternidadesPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [missions, setMissions] = useState<Option[]>([]);
  const [ministries, setMinistries] = useState<Option[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [isRoot, setIsRoot] = useState(false);
  const [isTopManager, setIsTopManager] = useState(false);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<GroupRequest[]>([]);
  const [myGroupIds, setMyGroupIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [pendingByGroup, setPendingByGroup] = useState<Record<string, number>>({});

  function load() {
    apiFetch("/groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setGroups);
  }

  useEffect(() => {
    load();
    fetchMe().then((me) => {
      setIsRoot(me?.profileLevel === "ROOT");
      setIsTopManager(me?.profileLevel === "ROOT" || me?.profileLevel === "COORDENACAO_GERAL");
      setMyMemberId(me?.member?.id ?? null);
    });
    apiFetch("/groups/my-requests")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyRequests);
    apiFetch("/groups/my-groups")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { id: string }[]) => setMyGroupIds(new Set(data.map((g) => g.id))));
    apiFetch("/missions")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMissions);
    apiFetch("/ministries")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMinistries);
    apiFetch("/members")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMembers);
  }, []);

  function canManage(group: Group) {
    return isTopManager || group.coordinatorId === myMemberId;
  }

  useEffect(() => {
    if (!groups) return;
    const manageableGroups = groups.filter((g) => isTopManager || g.coordinatorId === myMemberId);
    if (manageableGroups.length === 0) return;

    Promise.all(
      manageableGroups.map((g) =>
        apiFetch(`/groups/${g.id}/requests`)
          .then((res) => (res.ok ? res.json() : []))
          .then((requests: GroupRequest[]) => [g.id, requests.filter((r) => r.status === "PENDING").length] as const),
      ),
    ).then((entries) => setPendingByGroup(Object.fromEntries(entries)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, isTopManager, myMemberId]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const missionId = String(form.get("missionId") || "");
    const ministryId = String(form.get("ministryId") || "");

    const response = await apiFetch("/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: missionId ? "MISSION" : "MINISTRY",
        name: form.get("name"),
        description: form.get("description") || undefined,
        photoUrl: form.get("photoUrl") || undefined,
        addressStreet: form.get("addressStreet") || undefined,
        addressNumber: form.get("addressNumber") || undefined,
        addressNeighborhood: form.get("addressNeighborhood") || undefined,
        addressCity: form.get("addressCity") || undefined,
        addressState: form.get("addressState") || undefined,
        addressZipCode: form.get("addressZipCode") || undefined,
        missionId: missionId || undefined,
        ministryId: ministryId || undefined,
        coordinatorId: form.get("coordinatorId") || undefined,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setErrorMessage(data?.message ?? "Não foi possível criar a fraternidade");
      return;
    }

    setShowForm(false);
    load();
  }

  async function handleJoinRequest(id: string, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setJoiningId(id);
    try {
      const response = await apiFetch(`/groups/${id}/requests`, { method: "POST" });
      if (response.ok) {
        const request = await response.json();
        setMyRequests((prev) => [...prev, request]);
      }
    } finally {
      setJoiningId(null);
    }
  }

  const myRequestByGroup = Object.fromEntries(
    myRequests.filter((r) => r.status === "PENDING").map((r) => [r.groupId, r]),
  );

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Fraternidades</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isRoot
              ? "Crie fraternidades dentro de missões ou ministérios e defina um coordenador."
              : "Veja as fraternidades disponíveis e peça para participar."}
          </p>
        </div>
        {isRoot && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancelar" : "Nova fraternidade"}
          </button>
        )}
      </div>

      {isRoot && showForm && (
        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5 sm:max-w-md">
          <ImageUpload name="photoUrl" label="Foto" shape="circle" />
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Nome
            <input name="name" required minLength={2} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Descrição
            <textarea name="description" rows={2} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input name="addressStreet" placeholder="Rua" className={inputClass} />
            <input name="addressNumber" placeholder="Número" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input name="addressNeighborhood" placeholder="Bairro" className={inputClass} />
            <input name="addressCity" placeholder="Cidade" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select name="addressState" defaultValue="" className={inputClass}>
              <option value="">Estado</option>
              {BRAZIL_STATES.map((s) => (
                <option key={s.uf} value={s.uf}>
                  {s.name}
                </option>
              ))}
            </select>
            <input name="addressZipCode" placeholder="CEP" className={inputClass} />
          </div>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Missão (deixe em branco se for de um ministério)
            <select name="missionId" className={inputClass}>
              <option value="">—</option>
              {missions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Ministério (deixe em branco se for de uma missão)
            <select name="ministryId" className={inputClass}>
              <option value="">—</option>
              {ministries.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Coordenador
            <select name="coordinatorId" className={inputClass}>
              <option value="">—</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </label>
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button type="submit" className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Criar fraternidade
          </button>
        </form>
      )}

      {groups === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {groups?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhuma fraternidade cadastrada.</p>}

      {groups && groups.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {groups.map((group) => {
            const manageable = canManage(group);
            const myRequest = myRequestByGroup[group.id];

            return (
              <Link
                key={group.id}
                href={`/fraternidades/${group.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                  {group.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={group.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Users size={16} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {group.name}
                    {!group.isActive && (
                      <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Inativa
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {group.mission?.name ?? group.ministry?.name}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    Coordenador: {group.coordinator?.fullName ?? "—"}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {group._count.members} membro(s)
                    {formatAddress(group) ? (
                      <>
                        <span className="mx-1.5 text-zinc-300">·</span>
                        {formatAddress(group)}
                      </>
                    ) : null}
                  </p>
                </div>

                {manageable && pendingByGroup[group.id] > 0 && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    <Bell size={12} />
                    {pendingByGroup[group.id]} pedido(s)
                  </span>
                )}

                {!manageable && myGroupIds.has(group.id) && (
                  <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Você já é membro
                  </span>
                )}

                {!manageable &&
                  !myGroupIds.has(group.id) &&
                  (myRequest ? (
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${REQUEST_STATUS_META[myRequest.status].style}`}>
                      {REQUEST_STATUS_META[myRequest.status].label}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={joiningId === group.id}
                      onClick={(e) => handleJoinRequest(group.id, e)}
                      className="shrink-0 rounded-full bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
                    >
                      {joiningId === group.id ? "Enviando..." : "Quero participar"}
                    </button>
                  ))}

                <ChevronRight size={16} className="shrink-0 text-zinc-300" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

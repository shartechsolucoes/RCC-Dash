"use client";

import { Check, Clock, ExternalLink, MapPin, Pencil, Save, Trash2, User, UserMinus, Users, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { BRAZIL_STATES } from "@/lib/brazilStates";
import { ImageUpload } from "@/components/ImageUpload";

interface GroupMemberEntry {
  id: string;
  roleLabel: string;
  joinedAt: string;
  member: { id: string; fullName: string; photoUrl: string | null };
}

interface GroupDetail {
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
  members: GroupMemberEntry[];
  createdAt: string;
}

interface GroupRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  member?: { id: string; fullName: string; photoUrl: string | null };
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

const inputClass =
  "rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAddress(group: GroupDetail) {
  const line = [group.addressStreet, group.addressNumber].filter(Boolean).join(", ");
  const parts = [line, group.addressNeighborhood, group.addressCity, group.addressState, group.addressZipCode].filter(Boolean);
  return parts.join(" · ");
}

export default function FraternidadeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const groupId = params.id;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isTopManager, setIsTopManager] = useState(false);
  const [myMemberId, setMyMemberId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [editing, setEditing] = useState(false);
  const [requests, setRequests] = useState<GroupRequest[] | null>(null);
  const [myRequest, setMyRequest] = useState<GroupRequest | null>(null);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch(`/groups/${groupId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setGroup(data);
        else setNotFound(true);
      });
  }

  useEffect(() => {
    if (!groupId) return;
    load();
    fetchMe().then((me) => {
      setIsTopManager(me?.profileLevel === "ROOT" || me?.profileLevel === "COORDENACAO_GERAL");
      setMyMemberId(me?.member?.id ?? null);
    });
    apiFetch("/members")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMembers);
    apiFetch("/groups/my-requests")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: (GroupRequest & { groupId: string })[]) => {
        setMyRequest(all.find((r) => r.groupId === groupId && r.status === "PENDING") ?? null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const manageable = Boolean(group) && (isTopManager || group?.coordinatorId === myMemberId);
  const isAlreadyMember = Boolean(
    group && myMemberId && group.members.some((entry) => entry.member.id === myMemberId),
  );

  useEffect(() => {
    if (manageable && groupId) {
      apiFetch(`/groups/${groupId}/requests`)
        .then((res) => (res.ok ? res.json() : []))
        .then(setRequests);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manageable, groupId]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await apiFetch(`/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
        photoUrl: form.get("photoUrl") || null,
        addressStreet: form.get("addressStreet") || null,
        addressNumber: form.get("addressNumber") || null,
        addressNeighborhood: form.get("addressNeighborhood") || null,
        addressCity: form.get("addressCity") || null,
        addressState: form.get("addressState") || null,
        addressZipCode: form.get("addressZipCode") || null,
        coordinatorId: isTopManager ? form.get("coordinatorId") || null : undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar as alterações");
      return;
    }

    setEditing(false);
    load();
  }

  async function handleDelete() {
    if (!window.confirm("Excluir esta fraternidade?")) return;
    await apiFetch(`/groups/${groupId}`, { method: "DELETE" });
    router.push("/fraternidades");
  }

  async function handleJoin() {
    setJoining(true);
    try {
      const response = await apiFetch(`/groups/${groupId}/requests`, { method: "POST" });
      if (response.ok) {
        setMyRequest(await response.json());
      }
    } finally {
      setJoining(false);
    }
  }

  async function handleRequestStatus(requestId: string, status: "APPROVED" | "REJECTED") {
    await apiFetch(`/groups/${groupId}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    apiFetch(`/groups/${groupId}/requests`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRequests);
    load();
  }

  async function handleRemoveMember(memberId: string) {
    if (!window.confirm("Remover este membro da fraternidade?")) return;
    await apiFetch(`/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
    load();
  }

  if (notFound) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Fraternidade não encontrada.</p>
        <Link href="/fraternidades" className="mt-2 inline-block text-sm text-amber-700 hover:underline">
          ← Voltar
        </Link>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="px-8 py-8">
      <Link href="/fraternidades" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Fraternidades
      </Link>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
            {group.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={group.photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <Users size={22} />
            )}
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{group.name}</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {group.mission ? `Missão: ${group.mission.name}` : `Ministério: ${group.ministry?.name}`}
              <span className="mx-1.5 text-zinc-300">·</span>
              Criada em {formatDate(group.createdAt)}
            </p>
          </div>
        </div>

        {manageable && !editing && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <Pencil size={14} /> Editar
            </button>
            {isTopManager && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleUpdate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
          <ImageUpload name="photoUrl" label="Foto" defaultValue={group.photoUrl} shape="circle" />
          <label className={labelClass}>
            Nome
            <input name="name" defaultValue={group.name} required minLength={2} className={inputClass} />
          </label>
          <label className={labelClass}>
            Descrição
            <textarea name="description" defaultValue={group.description ?? ""} rows={4} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Rua
              <input name="addressStreet" defaultValue={group.addressStreet ?? ""} className={inputClass} />
            </label>
            <label className={labelClass}>
              Número
              <input name="addressNumber" defaultValue={group.addressNumber ?? ""} className={inputClass} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Bairro
              <input name="addressNeighborhood" defaultValue={group.addressNeighborhood ?? ""} className={inputClass} />
            </label>
            <label className={labelClass}>
              Cidade
              <input name="addressCity" defaultValue={group.addressCity ?? ""} className={inputClass} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Estado
              <select name="addressState" defaultValue={group.addressState ?? ""} className={inputClass}>
                <option value="">—</option>
                {BRAZIL_STATES.map((s) => (
                  <option key={s.uf} value={s.uf}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              CEP
              <input name="addressZipCode" defaultValue={group.addressZipCode ?? ""} className={inputClass} />
            </label>
          </div>
          {isTopManager && (
            <label className={labelClass}>
              Coordenador
              <select name="coordinatorId" defaultValue={group.coordinatorId ?? ""} className={inputClass}>
                <option value="">—</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </label>
          )}
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
              <Save size={14} /> Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : manageable ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Descrição</p>
            <p className="mt-2 text-sm text-zinc-700">{group.description || "Sem descrição."}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Endereço</p>
            <p className="mt-2 text-sm text-zinc-700">{formatAddress(group) || "Sem endereço cadastrado."}</p>
          </div>
          <div className="rounded-2xl border border-zinc-100 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Coordenador</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                {group.coordinator?.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={group.coordinator.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User size={14} />
                )}
              </span>
              <p className="text-sm text-zinc-800">{group.coordinator?.fullName ?? "Nenhum coordenador definido"}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Coordenador</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                  {group.coordinator?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={group.coordinator.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={14} />
                  )}
                </span>
                <p className="text-sm text-zinc-800">{group.coordinator?.fullName ?? "Nenhum coordenador definido"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-100 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Endereço</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-zinc-700">
                <MapPin size={14} className="shrink-0 text-zinc-400" />
                {formatAddress(group) || "Sem endereço cadastrado."}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center gap-2 text-sm text-zinc-700">
              <Users size={14} className="text-zinc-400" />
              {group.members.length} membro(s)
            </div>
            {isAlreadyMember ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                <Check size={14} /> Você já é membro
              </span>
            ) : myRequest ? (
              <span className={`inline-block shrink-0 rounded-full px-4 py-2 text-sm font-medium ${REQUEST_STATUS_META[myRequest.status].style}`}>
                Pedido {REQUEST_STATUS_META[myRequest.status].label.toLowerCase()}
              </span>
            ) : (
              <button
                type="button"
                disabled={joining}
                onClick={handleJoin}
                className="shrink-0 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-amber-400 disabled:opacity-50"
              >
                {joining ? "Enviando..." : "Quero participar"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Membros ({group.members.length})
        </p>
        {group.members.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Nenhum membro ainda.</p>
        ) : (
          <div className="mt-3 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
            {group.members.map((entry) => (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                  {entry.member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.member.photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User size={14} />
                  )}
                </span>
                <p className="flex-1 text-sm text-zinc-800">{entry.member.fullName}</p>
                <span className="text-xs text-zinc-400">{entry.roleLabel}</span>
                <span className="text-xs text-zinc-400">desde {formatDate(entry.joinedAt)}</span>
                <Link
                  href={`/membros/${entry.member.id}`}
                  className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                >
                  <ExternalLink size={12} /> Ver perfil
                </Link>
                {manageable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(entry.member.id)}
                    className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <UserMinus size={12} /> Remover
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {manageable && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Pedidos de participação</p>
          {requests === null && <p className="mt-2 text-sm text-zinc-500">Carregando...</p>}
          {requests && requests.filter((r) => r.status === "PENDING").length === 0 && (
            <p className="mt-2 text-sm text-zinc-500">Nenhum pedido pendente.</p>
          )}
          {requests && requests.filter((r) => r.status === "PENDING").length > 0 && (
            <div className="mt-3 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
              {requests
                .filter((r) => r.status === "PENDING")
                .map((request) => (
                <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                    {request.member?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={request.member.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={14} />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-zinc-800">{request.member?.fullName ?? "—"}</p>
                    <p className="text-xs text-zinc-400">Solicitado em {formatDate(request.requestedAt)}</p>
                  </div>
                  {request.member && (
                    <Link
                      href={`/membros/${request.member.id}`}
                      className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                      <ExternalLink size={12} /> Ver perfil
                    </Link>
                  )}
                  {request.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRequestStatus(request.id, "APPROVED")}
                        className="flex items-center gap-1 rounded-full bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        <Check size={12} /> Aprovar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRequestStatus(request.id, "REJECTED")}
                        className="flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        <X size={12} /> Recusar
                      </button>
                    </>
                  ) : (
                    <span className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium ${REQUEST_STATUS_META[request.status].style}`}>
                      <Clock size={12} />
                      {REQUEST_STATUS_META[request.status].label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

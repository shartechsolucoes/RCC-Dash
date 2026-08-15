"use client";

import { Check, ExternalLink, Save, Trash2, User, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { RichTextEditor } from "@/components/RichTextEditor";

interface Ministry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface MinistryRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt?: string;
  member?: { id: string; fullName: string; photoUrl: string | null };
}

const REQUEST_STATUS_META: Record<MinistryRequest["status"], { label: string; style: string }> = {
  PENDING: { label: "Pendente", style: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Aprovado", style: "bg-green-50 text-green-700" },
  REJECTED: { label: "Recusado", style: "bg-red-50 text-red-600" },
};

export default function MinisterioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const ministryId = params.id;

  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isTopManager, setIsTopManager] = useState(false);
  const [requests, setRequests] = useState<MinistryRequest[] | null>(null);
  const [myRequest, setMyRequest] = useState<MinistryRequest | null>(null);
  const [joining, setJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch("/ministries")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: Ministry[]) => {
        const found = all.find((m) => m.id === ministryId);
        if (found) setMinistry(found);
        else setNotFound(true);
      });
  }

  useEffect(() => {
    if (!ministryId) return;
    load();
    fetchMe().then((me) => {
      setIsTopManager(me?.profileLevel === "ROOT" || me?.profileLevel === "COORDENACAO_GERAL");
    });
    apiFetch("/ministries/my-requests")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: (MinistryRequest & { ministryId: string })[]) => {
        setMyRequest(all.find((r) => r.ministryId === ministryId && r.status === "PENDING") ?? null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ministryId]);

  useEffect(() => {
    if (isTopManager && ministryId) {
      apiFetch(`/ministries/${ministryId}/requests`)
        .then((res) => (res.ok ? res.json() : []))
        .then(setRequests);
    }
  }, [isTopManager, ministryId]);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await apiFetch(`/ministries/${ministryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description") || undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar as alterações");
      return;
    }

    load();
  }

  async function handleDelete() {
    if (!window.confirm("Excluir este ministério?")) return;
    await apiFetch(`/ministries/${ministryId}`, { method: "DELETE" });
    router.push("/ministerios");
  }

  async function handleJoin() {
    setJoining(true);
    try {
      const response = await apiFetch(`/ministries/${ministryId}/requests`, { method: "POST" });
      if (response.ok) setMyRequest(await response.json());
    } finally {
      setJoining(false);
    }
  }

  async function handleRequestStatus(requestId: string, status: "APPROVED" | "REJECTED") {
    await apiFetch(`/ministries/${ministryId}/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    apiFetch(`/ministries/${ministryId}/requests`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRequests);
  }

  if (notFound) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Ministério não encontrado.</p>
        <Link href="/ministerios" className="mt-2 inline-block text-sm text-amber-700 hover:underline">
          ← Voltar
        </Link>
      </main>
    );
  }

  if (!ministry) {
    return (
      <main className="px-8 py-8">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  const pendingRequests = requests?.filter((r) => r.status === "PENDING") ?? [];

  return (
    <main className="px-8 py-8">
      <Link href="/ministerios" className="text-sm text-zinc-400 hover:text-zinc-700">
        ← Ministérios
      </Link>

      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{ministry.name}</h1>
        {isTopManager ? (
          <button
            type="button"
            onClick={handleDelete}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} /> Excluir
          </button>
        ) : myRequest ? (
          <span className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${REQUEST_STATUS_META[myRequest.status].style}`}>
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

      {isTopManager ? (
        <form onSubmit={handleUpdate} className="mt-6 flex max-w-lg flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Nome
            <input name="name" defaultValue={ministry.name} required minLength={2} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <RichTextEditor name="description" label="Descrição" defaultValue={ministry.description} />
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button type="submit" className="flex items-center gap-1.5 self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            <Save size={14} /> Salvar
          </button>
        </form>
      ) : (
        ministry.description && (
          <div
            className="prose prose-sm mt-6 max-w-lg text-zinc-700"
            dangerouslySetInnerHTML={{ __html: ministry.description }}
          />
        )
      )}

      {isTopManager && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Pedidos de participação</p>
          {requests === null && <p className="mt-2 text-sm text-zinc-500">Carregando...</p>}
          {requests && pendingRequests.length === 0 && <p className="mt-2 text-sm text-zinc-500">Nenhum pedido pendente.</p>}
          {pendingRequests.length > 0 && (
            <div className="mt-3 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                    {request.member?.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={request.member.photoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User size={14} />
                    )}
                  </span>
                  <p className="flex-1 text-sm text-zinc-800">{request.member?.fullName ?? "—"}</p>
                  {request.member && (
                    <Link
                      href={`/membros/${request.member.id}`}
                      className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
                    >
                      <ExternalLink size={12} /> Ver perfil
                    </Link>
                  )}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

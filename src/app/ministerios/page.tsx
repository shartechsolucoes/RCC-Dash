"use client";

import { Bell, ChevronRight, Mic2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";

interface Ministry {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface MinistryRequest {
  id: string;
  ministryId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const REQUEST_STATUS_META: Record<MinistryRequest["status"], { label: string; style: string }> = {
  PENDING: { label: "Pendente", style: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Aprovado", style: "bg-green-50 text-green-700" },
  REJECTED: { label: "Recusado", style: "bg-red-50 text-red-600" },
};

export default function MinisteriosPage() {
  const [ministries, setMinistries] = useState<Ministry[] | null>(null);
  const [isTopManager, setIsTopManager] = useState(false);
  const [myRequests, setMyRequests] = useState<MinistryRequest[]>([]);
  const [pendingByMinistry, setPendingByMinistry] = useState<Record<string, number>>({});

  function load() {
    apiFetch("/ministries")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMinistries);
  }

  useEffect(() => {
    load();
    fetchMe().then((me) =>
      setIsTopManager(me?.profileLevel === "ROOT" || me?.profileLevel === "COORDENACAO_GERAL"),
    );
    apiFetch("/ministries/my-requests")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyRequests);
  }, []);

  useEffect(() => {
    if (!isTopManager || !ministries) return;
    Promise.all(
      ministries.map((m) =>
        apiFetch(`/ministries/${m.id}/requests`)
          .then((res) => (res.ok ? res.json() : []))
          .then((requests: MinistryRequest[]) => [m.id, requests.filter((r) => r.status === "PENDING").length] as const),
      ),
    ).then((entries) => setPendingByMinistry(Object.fromEntries(entries)));
  }, [isTopManager, ministries]);

  const myRequestByMinistry = Object.fromEntries(myRequests.map((r) => [r.ministryId, r]));

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Ministérios</h1>
          {!isTopManager && (
            <p className="mt-1 text-sm text-zinc-500">Veja as missões disponíveis e peça para participar.</p>
          )}
        </div>
        {isTopManager && (
          <Link
            href="/ministerios/novo"
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus size={16} />
            Novo ministério
          </Link>
        )}
      </div>

      {ministries === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}

      {ministries && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {ministries.map((ministry) => {
            const myRequest = myRequestByMinistry[ministry.id];
            return (
              <Link
                key={ministry.id}
                href={`/ministerios/${ministry.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Mic2 size={16} />
                </span>
                <p className="flex-1 text-sm font-medium text-zinc-900">{ministry.name}</p>

                {isTopManager && pendingByMinistry[ministry.id] > 0 && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    <Bell size={12} />
                    {pendingByMinistry[ministry.id]} pedido(s)
                  </span>
                )}

                {!isTopManager &&
                  (myRequest ? (
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${REQUEST_STATUS_META[myRequest.status].style}`}>
                      {REQUEST_STATUS_META[myRequest.status].label}
                    </span>
                  ) : null)}

                <ChevronRight size={16} className="shrink-0 text-zinc-300" />
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

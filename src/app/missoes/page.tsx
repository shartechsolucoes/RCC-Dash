"use client";

import { Bell, ChevronRight, Compass, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";

interface Mission {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface MissionRequest {
  id: string;
  missionId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

const REQUEST_STATUS_META: Record<MissionRequest["status"], { label: string; style: string }> = {
  PENDING: { label: "Pendente", style: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Aprovado", style: "bg-green-50 text-green-700" },
  REJECTED: { label: "Recusado", style: "bg-red-50 text-red-600" },
};

export default function MissoesPage() {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [isTopManager, setIsTopManager] = useState(false);
  const [myRequests, setMyRequests] = useState<MissionRequest[]>([]);
  const [pendingByMission, setPendingByMission] = useState<Record<string, number>>({});

  function load() {
    apiFetch("/missions")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMissions);
  }

  useEffect(() => {
    load();
    fetchMe().then((me) =>
      setIsTopManager(me?.profileLevel === "ROOT" || me?.profileLevel === "COORDENACAO_GERAL"),
    );
    apiFetch("/missions/my-requests")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyRequests);
  }, []);

  useEffect(() => {
    if (!isTopManager || !missions) return;
    Promise.all(
      missions.map((m) =>
        apiFetch(`/missions/${m.id}/requests`)
          .then((res) => (res.ok ? res.json() : []))
          .then((requests: MissionRequest[]) => [m.id, requests.filter((r) => r.status === "PENDING").length] as const),
      ),
    ).then((entries) => setPendingByMission(Object.fromEntries(entries)));
  }, [isTopManager, missions]);

  const myRequestByMission = Object.fromEntries(myRequests.map((r) => [r.missionId, r]));

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Missões</h1>
          {!isTopManager && (
            <p className="mt-1 text-sm text-zinc-500">Veja as missões disponíveis e peça para participar.</p>
          )}
        </div>
        {isTopManager && (
          <Link
            href="/missoes/novo"
            className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            <Plus size={16} />
            Nova missão
          </Link>
        )}
      </div>

      {missions === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}

      {missions && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {missions.map((mission) => {
            const myRequest = myRequestByMission[mission.id];
            return (
              <Link
                key={mission.id}
                href={`/missoes/${mission.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                  <Compass size={16} />
                </span>
                <p className="flex-1 text-sm font-medium text-zinc-900">{mission.name}</p>

                {isTopManager && pendingByMission[mission.id] > 0 && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                    <Bell size={12} />
                    {pendingByMission[mission.id]} pedido(s)
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

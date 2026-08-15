"use client";

import { ArrowUpRight, Bell, CheckSquare, Compass, Mic2, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";

interface MyGroup {
  id: string;
  name: string;
  photoUrl: string | null;
  mission: { id: string; name: string } | null;
  ministry: { id: string; name: string } | null;
  coordinator: { id: string; fullName: string } | null;
  isCoordinator: boolean;
  _count: { members: number };
}

const AGENDA = [
  { title: "Próximo evento", body: "Nenhum evento agendado." },
  { title: "Próxima reunião", body: "Nenhuma reunião agendada." },
];

const today = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export default function DashboardHome() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [missionCount, setMissionCount] = useState<number | null>(null);
  const [ministryCount, setMinistryCount] = useState<number | null>(null);
  const [myGroups, setMyGroups] = useState<MyGroup[] | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
    apiFetch("/missions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMissionCount(data.length));
    apiFetch("/ministries")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMinistryCount(data.length));
    apiFetch("/groups/my-groups")
      .then((res) => (res.ok ? res.json() : []))
      .then(setMyGroups);
  }, []);

  const firstName = user?.member?.fullName?.split(" ")[0];

  const stats = [
    { title: "Missões ativas", value: missionCount, icon: Compass },
    { title: "Ministérios ativos", value: ministryCount, icon: Mic2 },
    { title: "Tarefas pendentes", value: 0, icon: CheckSquare },
    { title: "Avisos", value: 0, icon: Bell },
  ];

  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Olá{firstName ? `, ${firstName}` : ""}!
      </h1>
      <p className="mt-1 text-sm capitalize text-zinc-500">{today}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-5 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">{stat.title}</span>
                <ArrowUpRight size={14} className="text-zinc-300" />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-400 shadow-sm">
                  <Icon size={14} />
                </span>
                <p className="text-2xl font-semibold text-zinc-900">
                  {stat.value ?? "–"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {myGroups !== null && myGroups.length > 0 && (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Minhas fraternidades</h2>
            <Link href="/fraternidades" className="text-sm text-zinc-500 hover:text-zinc-900">
              Ver todas
            </Link>
          </div>
          <div className="mt-4 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
            {myGroups.map((group) => (
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
                  <p className="truncate text-sm font-medium text-zinc-900">{group.name}</p>
                  <p className="truncate text-sm text-zinc-500">
                    {group.mission?.name ?? group.ministry?.name}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {group._count.members} membro(s)
                  </p>
                </div>
                {group.isCoordinator && (
                  <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                    Coordenador
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Agenda
        </h2>
      </div>
      <div className="mt-4 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
        {AGENDA.map((item) => (
          <div key={item.title} className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Bell size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                <p className="text-sm text-zinc-500">{item.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

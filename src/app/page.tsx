"use client";

import { ArrowUpRight, Bell, CheckSquare, ChevronLeft, ChevronRight, Compass, MapPin, MessageSquare, Mic2, User, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";

interface MuralPost {
  id: string;
  title: string | null;
  content: string;
  createdAt: string;
  author: { email: string; member: { fullName: string; photoUrl: string | null } | null };
}

function formatMuralDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

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

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZipCode: string | null;
  coordinator: { id: string; fullName: string; photoUrl: string | null } | null;
  mission: { id: string; name: string } | null;
  ministry: { id: string; name: string } | null;
  members: { id: string }[];
}

function formatGroupAddress(group: GroupDetail) {
  const line = [group.addressStreet, group.addressNumber].filter(Boolean).join(", ");
  const parts = [line, group.addressNeighborhood, group.addressCity, group.addressState, group.addressZipCode].filter(Boolean);
  return parts.join(" · ");
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
  const [muralPosts, setMuralPosts] = useState<MuralPost[] | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);

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
    apiFetch("/mural")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: MuralPost[]) => setMuralPosts(data.slice(0, 8)));
  }, []);

  const muralSliderRef = useRef<HTMLDivElement>(null);

  function scrollMural(direction: "left" | "right") {
    const el = muralSliderRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -320 : 320, behavior: "smooth" });
  }

  const firstName = user?.member?.fullName?.split(" ")[0];
  const isMembro = user?.profileLevel === "MEMBRO";
  const singleGroup = isMembro && myGroups?.length === 1 ? myGroups[0] : null;

  useEffect(() => {
    if (!singleGroup) return;
    apiFetch(`/groups/${singleGroup.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setGroupDetail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleGroup?.id]);

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

      {isMembro && muralPosts !== null && muralPosts.length > 0 && (
        <div className="relative mt-6">
          <button
            type="button"
            onClick={() => scrollMural("left")}
            className="absolute -left-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 sm:flex"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={muralSliderRef}
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {muralPosts.map((post) => (
              <div
                key={post.id}
                className="flex w-72 shrink-0 snap-start flex-col gap-2 rounded-2xl border border-primary-100 bg-primary-50/60 p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {post.author.member?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.author.member.photoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <MessageSquare size={14} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">
                      {post.author.member?.fullName ?? post.author.email}
                    </p>
                    <p className="text-xs text-zinc-400">{formatMuralDate(post.createdAt)}</p>
                  </div>
                </div>
                {post.title && <p className="text-sm font-semibold text-zinc-900">{post.title}</p>}
                <p className="line-clamp-4 whitespace-pre-line text-sm text-zinc-700">{post.content}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scrollMural("right")}
            className="absolute -right-3 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm hover:bg-zinc-50 sm:flex"
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

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

      {singleGroup && groupDetail && (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Minha fraternidade</h2>
          </div>
          <div className="mt-4 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100 text-zinc-500">
                {groupDetail.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={groupDetail.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Users size={20} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-zinc-900">{groupDetail.name}</p>
                <p className="truncate text-sm text-zinc-500">
                  {groupDetail.mission?.name ?? groupDetail.ministry?.name}
                  <span className="mx-1.5 text-zinc-300">·</span>
                  {groupDetail.members.length} membro(s)
                </p>
              </div>
              {singleGroup.isCoordinator && (
                <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Coordenador
                </span>
              )}
            </div>

            {groupDetail.description && (
              <p className="text-sm text-zinc-700">{groupDetail.description}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <User size={14} className="shrink-0 text-zinc-400" />
                {groupDetail.coordinator?.fullName ?? "Nenhum coordenador definido"}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-700">
                <MapPin size={14} className="shrink-0 text-zinc-400" />
                {formatGroupAddress(groupDetail) || "Sem endereço cadastrado."}
              </div>
            </div>
          </div>
        </>
      )}

      {myGroups !== null && myGroups.length > 1 && (
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

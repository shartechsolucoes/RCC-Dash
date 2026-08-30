"use client";

import { Calendar, Compass, MapPin, Mic2, Users } from "lucide-react";

const TODAY = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const KPIS = [
  { label: "Minhas fraternidades", value: 1, icon: Users, tone: "accent" as const },
  { label: "Próximos eventos", value: 3, icon: Calendar, tone: "violet" as const },
  { label: "Missões ativas", value: 4, icon: Compass, tone: "gold" as const },
  { label: "Ministérios ativos", value: 4, icon: Mic2, tone: "green" as const },
];

const TONE_CLASSES = {
  accent: "bg-primary-50 text-primary-600",
  violet: "bg-violet-50 text-violet-600",
  gold: "bg-warning-50 text-warning-600",
  green: "bg-success-50 text-success-600",
};

const MURAL_POSTS = [
  { author: "Coordenação Geral", date: "18 ago", title: "Pastoral de Rua", body: "Todas as sextas, saída da casa dos freis. Entre em contato para participar." },
  { author: "Coordenação Geral", date: "18 ago", title: "RESGATÃO 2026", body: "Venha viver a continuação do Resgata-me, dias 10 e 11 de setembro." },
  { author: "Coordenação Geral", date: "18 ago", title: "Adoração ao Santíssimo", body: "Todas as quintas, ao lado da casa dos freis, às 19h30." },
];

const AGENDA = [
  { day: "10", month: "set", title: "RESGATÃO 2026", meta: "Sede da Fraternidade · 09:00", tone: "accent" as const },
  { day: "14", month: "set", title: "Encontro de Coordenadores", meta: "Salão Paroquial · 19:30", tone: "violet" as const },
  { day: "21", month: "set", title: "Adoração ao Santíssimo", meta: "Casa dos Freis · 19:30", tone: "gold" as const },
];

const AGENDA_DATE_TONE = {
  accent: "bg-primary-600",
  violet: "bg-violet-600",
  gold: "bg-warning-600",
};

const REGISTRATIONS = [
  { label: "Pendentes", value: 11, tone: "var(--color-warning-500)", dot: "bg-warning-500" },
  { label: "Aprovadas", value: 4, tone: "var(--color-success-500)", dot: "bg-success-500" },
  { label: "Lista de espera", value: 2, tone: "var(--color-primary-500)", dot: "bg-primary-500" },
  { label: "Rejeitadas", value: 1, tone: "var(--color-danger-500)", dot: "bg-danger-500" },
];

function registrationsGradient() {
  const total = REGISTRATIONS.reduce((sum, r) => sum + r.value, 0);
  let cursor = 0;
  const stops = REGISTRATIONS.map((r) => {
    const start = (cursor / total) * 360;
    cursor += r.value;
    const end = (cursor / total) * 360;
    return `${r.tone} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

const GROUPS = [
  { name: "Fraternidade Teste", members: "12 membros", icon: Users, tone: "accent" as const },
  { name: "Louvor Jovem", members: "8 membros", icon: Mic2, tone: "violet" as const },
  { name: "Missão Resgate", members: "21 membros", icon: Compass, tone: "gold" as const },
];

export default function DashboardHome() {
  return (
    <main className="px-6 py-8 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Olá, Marina!</h1>
      <p className="mt-1 text-sm capitalize text-zinc-500">{TODAY}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${TONE_CLASSES[kpi.tone]}`}>
                <Icon size={18} />
              </span>
              <p className="mt-4 text-2xl font-bold text-zinc-900">{kpi.value}</p>
              <p className="text-sm text-zinc-500">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Mural */}
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-12">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-base font-semibold text-zinc-900">Mural</h2>
            <span className="text-sm font-medium text-primary-600">Ver tudo</span>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto px-6 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MURAL_POSTS.map((post) => (
              <div key={post.title} className="flex w-60 shrink-0 flex-col gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-[11px] font-bold text-violet-600">
                    CG
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-xs font-semibold text-zinc-900">{post.author}</p>
                    <p className="text-[11px] text-zinc-400">{post.date}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-zinc-900">{post.title}</p>
                <p className="text-xs leading-relaxed text-zinc-500">{post.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Agenda */}
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-base font-semibold text-zinc-900">Agenda</h2>
            <span className="text-sm font-medium text-primary-600">Ver todos</span>
          </div>
          <div className="flex flex-col gap-2.5 px-6 py-5">
            {AGENDA.map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-2xl bg-zinc-50/60 p-3">
                <span className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl text-white ${AGENDA_DATE_TONE[item.tone]}`}>
                  <span className="text-base font-bold leading-none">{item.day}</span>
                  <span className="text-[9px] uppercase tracking-wide leading-none opacity-85">{item.month}</span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900">{item.title}</p>
                  <p className="truncate text-xs text-zinc-500">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Minha fraternidade */}
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-5">
          <h2 className="px-6 pt-5 text-base font-semibold text-zinc-900">Minha fraternidade</h2>
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-primary-50 text-violet-600">
                <Users size={22} />
              </span>
              <div>
                <p className="text-sm font-bold text-zinc-900">Fraternidade Teste</p>
                <p className="text-xs text-zinc-500">Juventude · 12 membros</p>
              </div>
            </div>
            <span className="w-fit rounded-full bg-warning-50 px-3 py-1 text-xs font-bold text-warning-600">
              ★ Coordenador: Ana Souza
            </span>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <MapPin size={14} className="shrink-0 text-zinc-400" />
              Rua das Palmeiras, 200 · Centro · Curitiba
            </div>
          </div>
        </div>

        {/* Inscrições (coordenador) */}
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-5">
          <h2 className="px-6 pt-5 text-base font-semibold text-zinc-900">Inscrições em eventos</h2>
          <div className="flex items-center gap-6 px-6 py-5">
            <div
              className="relative h-28 w-28 shrink-0 rounded-full"
              style={{ background: registrationsGradient() }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                <span className="text-xl font-bold text-zinc-900">18</span>
                <span className="text-[10px] text-zinc-400">inscrições</span>
              </div>
            </div>
            <ul className="flex flex-1 flex-col gap-2.5">
              {REGISTRATIONS.map((r) => (
                <li key={r.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-zinc-600">
                    <span className={`h-2.5 w-2.5 rounded-full ${r.dot}`} />
                    {r.label}
                  </span>
                  <span className="font-bold text-zinc-900">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Meus grupos (coordenador) */}
        <div className="rounded-3xl border border-zinc-100 bg-white shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between px-6 pt-5">
            <h2 className="text-base font-semibold text-zinc-900">Meus grupos</h2>
            <span className="text-sm font-medium text-primary-600">Gerenciar</span>
          </div>
          <div className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-3">
            {GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.name} className="flex flex-col gap-2 rounded-2xl bg-zinc-50/60 p-3.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASSES[group.tone]}`}>
                    <Icon size={15} />
                  </span>
                  <p className="text-sm font-semibold text-zinc-900">{group.name}</p>
                  <p className="text-xs text-zinc-400">{group.members}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

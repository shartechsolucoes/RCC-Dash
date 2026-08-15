"use client";

import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  Compass,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MessageSquare,
  Mic2,
  Newspaper,
  PanelLeft,
  Route,
  Settings,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { ALL_ROLES, TOP_ROLES, MANAGEMENT_ROLES, hasAccess, type ProfileLevel } from "@/lib/permissions";

const SIDEBAR_LINKS = [
  { label: "Início", href: "/", icon: Home, roles: ALL_ROLES },
  { label: "Meu Perfil", href: "/perfil", icon: Users, roles: ALL_ROLES },
  { label: "Minha Jornada", href: "/jornada", icon: Route, roles: ALL_ROLES },
  { label: "Mural", href: "/mural", icon: MessageSquare, roles: ALL_ROLES },
  { label: "Calendário", href: "/calendario", icon: Calendar, roles: TOP_ROLES },
  { label: "Membros", href: "/membros", icon: Users, roles: ALL_ROLES },
  { label: "Notícias", href: "/noticias", icon: Newspaper, roles: MANAGEMENT_ROLES },
  { label: "Empresas Amigas", href: "/empresas", icon: Building2, roles: ALL_ROLES },
  { label: "Galeria", href: "/galeria", icon: ImageIcon, roles: ALL_ROLES },
  { label: "Convites", href: "/convites", icon: Mail, badgeKey: "invitations" as const, roles: TOP_ROLES },
  { label: "Missões", href: "/missoes", icon: Compass, roles: ALL_ROLES },
  { label: "Ministérios", href: "/ministerios", icon: Mic2, roles: ALL_ROLES },
  { label: "Fraternidades", href: "/fraternidades", icon: Users, roles: ALL_ROLES },
  { label: "Eventos", href: "/eventos", icon: LayoutGrid, roles: ALL_ROLES },
  { label: "Administração", href: "/admin", icon: Settings, roles: TOP_ROLES },
];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function Sidebar() {
  const pathname = usePathname();
  const [pendingCounts, setPendingCounts] = useState<{ invitations: number; registrations: number }>({
    invitations: 0,
    registrations: 0,
  });
  const [profileLevel, setProfileLevel] = useState<ProfileLevel | null>(null);

  useEffect(() => {
    fetchMe().then((me) => setProfileLevel((me?.profileLevel as ProfileLevel) ?? null));
  }, []);

  useEffect(() => {
    apiFetch("/invitations")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: { status: string }[]) => {
        setPendingCounts((prev) => ({ ...prev, invitations: items.filter((i) => i.status === "PENDING").length }));
      });

    apiFetch("/registrations")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: { status: string }[]) => {
        setPendingCounts((prev) => ({ ...prev, registrations: items.filter((i) => i.status === "PENDING").length }));
      });
  }, []);

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto py-2 sm:flex">
      <div className="flex items-center justify-between px-2">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-sm text-white">
            R
          </span>
          RCC
          <ChevronDown size={14} className="text-zinc-400" />
        </a>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {SIDEBAR_LINKS.filter((link) => hasAccess(profileLevel, link.roles)).map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          const pendingCount = link.badgeKey ? pendingCounts[link.badgeKey] : 0;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="flex-1">{link.label}</span>
              {pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-2">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
              <Bell size={14} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900">Avisos</p>
              <p className="truncate text-xs text-zinc-500">Nenhum aviso novo</p>
            </div>
          </div>
        </div>

        <a
          href={SITE_URL}
          className="rounded-xl px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          ← Voltar ao site
        </a>
      </div>
    </aside>
  );
}

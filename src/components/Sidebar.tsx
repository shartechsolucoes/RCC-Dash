"use client";

import { Bell, ChevronDown, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { hasAccess, type ProfileLevel } from "@/lib/permissions";
import { NAV_LINKS } from "@/config/nav";

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

  const isRoot = profileLevel === "ROOT";
  const accentSolid = isRoot ? "bg-accent-root-700" : "bg-primary-600";
  const accentActive = isRoot
    ? "bg-accent-root-100 font-medium text-accent-root-800"
    : "bg-primary-50 font-medium text-primary-700";

  return (
    <aside className="hidden w-64 shrink-0 flex-col gap-4 overflow-y-auto py-2 sm:flex">
      <div className="flex items-center justify-between px-2">
        <a href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-900">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm text-white ${accentSolid}`}>
            R
          </span>
          RCC
          {isRoot && (
            <span className="rounded-full bg-accent-root-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-root-700">
              Root
            </span>
          )}
          <ChevronDown size={14} className="text-slate-400" />
        </a>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-2">
        {NAV_LINKS.filter((link) => hasAccess(profileLevel, link.roles)).map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          const pendingCount = link.badgeKey ? pendingCounts[link.badgeKey] : 0;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active ? accentActive : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              <span className="flex-1">{link.label}</span>
              {pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[11px] font-semibold text-white">
                  {pendingCount}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 px-2">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 shadow-card">
          <div className="flex items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium text-white ${accentSolid}`}>
              <Bell size={14} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">Avisos</p>
              <p className="truncate text-xs text-slate-500">Nenhum aviso novo</p>
            </div>
          </div>
        </div>

        <a
          href={SITE_URL}
          className="rounded-xl px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          ← Voltar ao site
        </a>
      </div>
    </aside>
  );
}

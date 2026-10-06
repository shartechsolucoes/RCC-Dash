"use client";

import { ChevronDown, LogOut, Menu, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { apiFetch, clearToken, fetchMe, type CurrentUser } from "@/lib/auth";
import { hasAccess, type ProfileLevel } from "@/lib/permissions";
import { NAV_GROUPS, NAV_LINKS, isNavActive, type NavGroupKey, type NavLink } from "@/config/nav";
import { NotificationBell } from "@/components/NotificationBell";

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
      {count}
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pendingCounts, setPendingCounts] = useState<{ invitations: number }>({ invitations: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<NavGroupKey | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  useEffect(() => {
    apiFetch("/invitations")
      .then((res) => (res.ok ? res.json() : []))
      .then((items: { status: string }[]) => {
        setPendingCounts({ invitations: items.filter((i) => i.status === "PENDING").length });
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setOpenGroup(null);
  }, [pathname]);

  const profileLevel = (user?.profileLevel as ProfileLevel) ?? null;
  const links = NAV_LINKS.filter((link) => hasAccess(profileLevel, link.roles));
  const displayName = user?.member?.fullName ?? user?.email ?? "";

  // Barra superior: links soltos + um item por grupo, na posição do primeiro link do grupo.
  // Grupo com um único link visível para o perfil vira link solto.
  type TopItem = { kind: "link"; link: NavLink } | { kind: "group"; key: NavGroupKey; links: NavLink[] };
  const topItems: TopItem[] = [];
  for (const link of links) {
    if (link.hideInTopbar) continue;
    const groupLinks = link.group ? links.filter((l) => l.group === link.group) : [];
    if (!link.group || groupLinks.length < 2) {
      topItems.push({ kind: "link", link });
    } else if (!topItems.some((item) => item.kind === "group" && item.key === link.group)) {
      topItems.push({ kind: "group", key: link.group, links: groupLinks });
    }
  }

  // Drawer: links soltos primeiro, depois cada grupo sob seu título.
  const drawerSections: { title?: string; links: NavLink[] }[] = [
    { links: links.filter((l) => !l.group) },
    ...(Object.keys(NAV_GROUPS) as NavGroupKey[])
      .map((key) => ({ title: NAV_GROUPS[key].label, links: links.filter((l) => l.group === key) }))
      .filter((section) => section.links.length > 0),
  ];

  const badgeFor = (link: NavLink) => (link.badgeKey ? pendingCounts[link.badgeKey] : 0);

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen flex-1 bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 lg:gap-4 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image src="/logo-cropped.png" alt="RCC" width={555} height={287} className="h-8 w-auto invert" priority />
            <span className="text-lg font-extrabold tracking-tight text-slate-900">RCC</span>
          </Link>

          <nav
            ref={navRef}
            aria-label="Navegação principal"
            className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 rounded-full p-1 lg:flex"
          >
            {topItems.map((item) => {
              if (item.kind === "link") {
                const { link } = item;
                const Icon = link.icon;
                const active = isNavActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
                      active ? "bg-primary-600 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {active && <Icon className="h-4 w-4" />}
                    {link.shortLabel ?? link.label}
                    <Badge count={badgeFor(link)} />
                  </Link>
                );
              }

              const group = NAV_GROUPS[item.key];
              const GroupIcon = group.icon;
              const active = item.links.some((l) => isNavActive(pathname, l.href));
              const open = openGroup === item.key;
              const groupBadge = item.links.reduce((sum, l) => sum + badgeFor(l), 0);
              return (
                <div key={item.key} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenGroup(open ? null : item.key)}
                    aria-expanded={open}
                    aria-haspopup="menu"
                    className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium transition-colors ${
                      active
                        ? "bg-primary-600 text-white"
                        : open
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {active && <GroupIcon className="h-4 w-4" />}
                    {group.label}
                    <Badge count={groupBadge} />
                    <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>

                  {open && (
                    <div
                      role="menu"
                      className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5 shadow-card-hover"
                    >
                      {item.links.map((link) => {
                        const Icon = link.icon;
                        const linkActive = isNavActive(pathname, link.href);
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            role="menuitem"
                            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                              linkActive ? "bg-primary-50 font-medium text-primary-700" : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <Icon size={16} strokeWidth={2} className="shrink-0" />
                            <span className="flex-1">{link.label}</span>
                            <Badge count={badgeFor(link)} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0 lg:gap-2">
            <button
              type="button"
              className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:flex"
              aria-label="Buscar"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <NotificationBell />
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-slate-100 lg:pr-3"
                  aria-label="Menu da conta"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-medium text-white">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden text-sm text-slate-600 lg:block">{displayName}</span>
                  <ChevronDown
                    size={14}
                    className={`hidden text-slate-400 transition-transform lg:block ${menuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-slate-100 bg-white py-1 shadow-card-hover">
                    <div className="border-b border-slate-50 px-3.5 py-2">
                      <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                    </div>
                    <Link
                      href="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                      Meu perfil
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
                    >
                      <LogOut size={15} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {drawerOpen && (
          <nav className="flex max-h-[calc(100vh-64px)] flex-col gap-1 overflow-y-auto border-t border-slate-100 px-4 py-3 lg:hidden">
            {drawerSections.map((section) => (
              <div key={section.title ?? "geral"} className="flex flex-col gap-1">
                {section.title && (
                  <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </p>
                )}
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isNavActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        active ? "bg-primary-50 font-medium text-primary-700" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} />
                      <span className="flex-1">{link.label}</span>
                      <Badge count={badgeFor(link)} />
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-7xl">{children}</main>
    </div>
  );
}

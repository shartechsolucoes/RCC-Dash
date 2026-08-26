"use client";

import { ChevronDown, LogOut, Search, UserCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clearToken, fetchMe, type CurrentUser } from "@/lib/auth";
import { NotificationBell } from "@/components/NotificationBell";

export function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = user?.member?.fullName ?? user?.email ?? "";
  const isRoot = user?.profileLevel === "ROOT";
  const accentSolid = isRoot ? "bg-accent-root-700" : "bg-primary-600";

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
      <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-400">
        <Search size={16} />
        <input
          type="search"
          placeholder="Pesquisar"
          className="w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
        <kbd className="rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400">
          ⌘K
        </kbd>
      </label>

      <div className="flex items-center gap-3">
        <NotificationBell />
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 hover:bg-slate-50"
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium text-white ${accentSolid}`}>
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm text-slate-600">{displayName}</span>
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-card-hover">
                <div className="border-b border-slate-50 px-3.5 py-2">
                  <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
                </div>
                <Link
                  href="/perfil"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <UserCircle size={15} className="text-slate-400" />
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
  );
}

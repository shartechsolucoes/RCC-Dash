"use client";

import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { clearToken, fetchMe, type CurrentUser } from "@/lib/auth";

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

  function handleLogout() {
    clearToken();
    router.replace("/login");
  }

  return (
    <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
      <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-sm text-zinc-400">
        <Search size={16} />
        <input
          type="search"
          placeholder="Pesquisar"
          className="w-full bg-transparent text-zinc-700 placeholder:text-zinc-400 focus:outline-none"
        />
        <kbd className="rounded border border-zinc-200 px-1.5 py-0.5 text-xs text-zinc-400">
          ⌘K
        </kbd>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
        >
          <Bell size={18} />
        </button>
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-zinc-200 py-1 pl-1 pr-3 hover:bg-zinc-50"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm text-zinc-600">{user.email}</span>
              <ChevronDown
                size={14}
                className={`text-zinc-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-100 bg-white py-1 shadow-lg">
                <div className="border-b border-zinc-50 px-3.5 py-2">
                  <p className="truncate text-xs font-medium text-zinc-900">{displayName}</p>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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

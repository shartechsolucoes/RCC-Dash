"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { useNotifications } from "@/hooks/useNotifications";
import { markSeen, type NotificationSource } from "@/lib/notifications";

function formatRelative(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
}

export function NotificationBell() {
  const { items, reload } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleItemClick(source: NotificationSource) {
    markSeen(source);
    setOpen(false);
    reload();
  }

  function handleMarkAllRead() {
    (["mural", "noticias", "eventos"] as NotificationSource[]).forEach(markSeen);
    reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {items.length > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-semibold text-white">
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card-hover">
          <div className="flex items-center justify-between border-b border-slate-50 px-4 py-2.5">
            <p className="text-sm font-semibold text-slate-900">Notificações</p>
            {items.length > 0 && (
              <button type="button" onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:underline">
                Marcar tudo como lido
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma novidade por aqui.</p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => handleItemClick(item.source)}
                  className="flex items-start gap-2 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400">
                      {item.sublabel} · {formatRelative(item.date)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

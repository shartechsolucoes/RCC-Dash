"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";
import { getLastSeen, type NotificationSource } from "@/lib/notifications";

export interface NotificationItem {
  id: string;
  source: NotificationSource;
  label: string;
  sublabel: string;
  href: string;
  date: string;
}

interface MuralPost {
  id: string;
  title: string | null;
  createdAt: string;
}

interface NewsItem {
  id: string;
  title: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  createdAt: string;
}

interface EventItem {
  id: string;
  name: string;
  createdAt: string;
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(() => {
    Promise.all([
      apiFetch("/mural").then((r) => (r.ok ? r.json() : [])),
      apiFetch("/news").then((r) => (r.ok ? r.json() : [])),
      apiFetch("/events").then((r) => (r.ok ? r.json() : [])),
    ]).then(([mural, news, events]: [MuralPost[], NewsItem[], EventItem[]]) => {
      const muralLastSeen = getLastSeen("mural");
      const newsLastSeen = getLastSeen("noticias");
      const eventsLastSeen = getLastSeen("eventos");

      const muralItems: NotificationItem[] = mural
        .filter((post) => new Date(post.createdAt).getTime() > muralLastSeen)
        .map((post) => ({
          id: `mural-${post.id}`,
          source: "mural",
          label: post.title || "Novo aviso no mural",
          sublabel: "Mural",
          href: "/mural",
          date: post.createdAt,
        }));

      const newsItems: NotificationItem[] = news
        .filter((item) => item.status === "PUBLISHED" && new Date(item.publishedAt ?? item.createdAt).getTime() > newsLastSeen)
        .map((item) => ({
          id: `news-${item.id}`,
          source: "noticias",
          label: item.title,
          sublabel: "Notícias",
          href: "/noticias",
          date: item.publishedAt ?? item.createdAt,
        }));

      const eventItems: NotificationItem[] = events
        .filter((event) => new Date(event.createdAt).getTime() > eventsLastSeen)
        .map((event) => ({
          id: `event-${event.id}`,
          source: "eventos",
          label: event.name,
          sublabel: "Eventos",
          href: `/eventos/${event.id}`,
          date: event.createdAt,
        }));

      setItems(
        [...muralItems, ...newsItems, ...eventItems].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, reload: load };
}

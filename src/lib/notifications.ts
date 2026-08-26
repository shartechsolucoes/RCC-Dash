export type NotificationSource = "mural" | "noticias" | "eventos";

const STORAGE_PREFIX = "rcc_last_seen_";

export function getLastSeen(source: NotificationSource): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_PREFIX + source);
  return raw ? Number(raw) : 0;
}

export function markSeen(source: NotificationSource) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_PREFIX + source, String(Date.now()));
}

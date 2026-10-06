import {
  Building2,
  Calendar,
  Compass,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MessageSquare,
  Mic2,
  Newspaper,
  Route,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ALL_ROLES, TOP_ROLES, MANAGEMENT_ROLES, type ProfileLevel } from "@/lib/permissions";

export type NavGroupKey = "comunidade" | "conteudo";

export interface NavLink {
  label: string;
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "invitations";
  roles: ProfileLevel[];
  // Links com grupo aparecem num menu suspenso na barra superior (no drawer, sob um título).
  group?: NavGroupKey;
  // Some da barra superior (continua no drawer do celular).
  hideInTopbar?: boolean;
}

export const NAV_GROUPS: Record<NavGroupKey, { label: string; icon: LucideIcon }> = {
  comunidade: { label: "Comunidade", icon: Users },
  conteudo: { label: "Conteúdo", icon: Newspaper },
};

// A ordem define a posição na barra; cada grupo ocupa o lugar do seu primeiro link.
export const NAV_LINKS: NavLink[] = [
  { label: "Início", href: "/", icon: Home, roles: ALL_ROLES, hideInTopbar: true },
  { label: "Minha Jornada", shortLabel: "Jornada", href: "/jornada", icon: Route, roles: ALL_ROLES },
  { label: "Eventos", href: "/eventos", icon: LayoutGrid, roles: ALL_ROLES },
  { label: "Calendário", href: "/calendario", icon: Calendar, roles: TOP_ROLES },
  { label: "Membros", href: "/membros", icon: Users, roles: MANAGEMENT_ROLES, group: "comunidade" },
  { label: "Fraternidades", href: "/fraternidades", icon: Users, roles: MANAGEMENT_ROLES, group: "comunidade" },
  { label: "Ministérios", href: "/ministerios", icon: Mic2, roles: ALL_ROLES, group: "comunidade" },
  { label: "Missões", href: "/missoes", icon: Compass, roles: ALL_ROLES, group: "comunidade" },
  { label: "Convites", href: "/convites", icon: Mail, badgeKey: "invitations", roles: TOP_ROLES, group: "comunidade" },
  { label: "Mural", href: "/mural", icon: MessageSquare, roles: MANAGEMENT_ROLES, group: "conteudo" },
  { label: "Notícias", href: "/noticias", icon: Newspaper, roles: ALL_ROLES, group: "conteudo" },
  { label: "Galeria", href: "/galeria", icon: ImageIcon, roles: ALL_ROLES, group: "conteudo" },
  { label: "Empresas Amigas", href: "/empresas", icon: Building2, roles: ALL_ROLES, group: "conteudo" },
  { label: "Administração", shortLabel: "Admin", href: "/admin", icon: Settings, roles: TOP_ROLES },
];

export function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

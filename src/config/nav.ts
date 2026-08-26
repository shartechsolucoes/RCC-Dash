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

export interface NavLink {
  label: string;
  shortLabel?: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "invitations";
  roles: ProfileLevel[];
}

export const NAV_LINKS: NavLink[] = [
  { label: "Início", href: "/", icon: Home, roles: ALL_ROLES },
  { label: "Minha Jornada", shortLabel: "Jornada", href: "/jornada", icon: Route, roles: ALL_ROLES },
  { label: "Mural", href: "/mural", icon: MessageSquare, roles: MANAGEMENT_ROLES },
  { label: "Calendário", href: "/calendario", icon: Calendar, roles: TOP_ROLES },
  { label: "Membros", href: "/membros", icon: Users, roles: MANAGEMENT_ROLES },
  { label: "Notícias", href: "/noticias", icon: Newspaper, roles: ALL_ROLES },
  { label: "Empresas Amigas", shortLabel: "Empresas", href: "/empresas", icon: Building2, roles: ALL_ROLES },
  { label: "Galeria", href: "/galeria", icon: ImageIcon, roles: ALL_ROLES },
  { label: "Convites", href: "/convites", icon: Mail, badgeKey: "invitations", roles: TOP_ROLES },
  { label: "Missões", href: "/missoes", icon: Compass, roles: ALL_ROLES },
  { label: "Ministérios", shortLabel: "Ministérios", href: "/ministerios", icon: Mic2, roles: ALL_ROLES },
  { label: "Fraternidades", shortLabel: "Fraternid.", href: "/fraternidades", icon: Users, roles: MANAGEMENT_ROLES },
  { label: "Eventos", href: "/eventos", icon: LayoutGrid, roles: ALL_ROLES },
  { label: "Administração", shortLabel: "Admin", href: "/admin", icon: Settings, roles: TOP_ROLES },
];

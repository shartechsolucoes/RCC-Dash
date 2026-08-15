"use client";

import { BarChart3, ChevronRight, Settings, UserCog, Wallet } from "lucide-react";

const ADMIN_SECTIONS = [
  { label: "Usuários", icon: UserCog, href: "/admin/usuarios" },
  { label: "Financeiro", icon: Wallet, href: "/admin/financeiro" },
  { label: "Relatórios", icon: BarChart3, href: "/admin/relatorios" },
  { label: "Configurações", icon: Settings, href: "/admin/configuracoes" },
];

export default function AdminPage() {
  return (
    <main className="px-8 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Administração
      </h1>

      <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
        {ADMIN_SECTIONS.map((section) => {
          const Icon = section.icon;
          const content = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <Icon size={16} />
              </span>
              <p className="flex-1 text-sm font-medium text-zinc-900">{section.label}</p>
              {section.href ? (
                <ChevronRight size={16} className="text-zinc-300" />
              ) : (
                <span className="text-xs text-zinc-400">Em construção</span>
              )}
            </>
          );

          if (section.href) {
            return (
              <a
                key={section.label}
                href={section.href}
                className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50"
              >
                {content}
              </a>
            );
          }

          return (
            <div key={section.label} className="flex items-center gap-3 px-5 py-4 opacity-60">
              {content}
            </div>
          );
        })}
      </div>
    </main>
  );
}

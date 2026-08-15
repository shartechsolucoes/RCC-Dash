"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { login } from "@/lib/auth";

const DEMO_ACCOUNTS = [
  { label: "Root", email: "root.demo@fraternidade.local" },
  { label: "Coordenação Geral", email: "coordenacao.demo@fraternidade.local" },
  { label: "Coordenador", email: "coordenador.demo@fraternidade.local" },
  { label: "Membro", email: "membro.demo@fraternidade.local" },
];
const DEMO_PASSWORD = "demo1234";

export default function LoginPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const isDev = process.env.NODE_ENV !== "production";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);

    try {
      await login(String(form.get("email")), String(form.get("password")));
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  async function handleDemoLogin(email: string) {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login(email, DEMO_PASSWORD);
      router.replace("/");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1">
      <div
        className="relative hidden bg-cover bg-center lg:block lg:w-[62%]"
        style={{ backgroundImage: "url('/bg-hero.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/50" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-400/70 text-sm text-amber-400">
              R
            </span>
            <span className="text-sm font-semibold tracking-[0.2em]">RCC</span>
          </div>
          <div className="max-w-sm">
            <p className="text-2xl font-light leading-snug">
              Uma única plataforma para conectar pessoas, formação, missões, ministérios e eventos da RCC.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
          <div className="flex flex-col items-center gap-2 text-center lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/70 text-sm text-amber-500">
              R
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Bem-vindo de volta</h1>
            <p className="text-sm text-zinc-500">Entre com suas credenciais para acessar o painel</p>
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            E-mail
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 transition-colors focus-within:border-zinc-900 focus-within:bg-white">
              <Mail size={16} className="text-zinc-400" />
              <input
                type="email"
                name="email"
                required
                placeholder="voce@email.com"
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
            Senha
            <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 transition-colors focus-within:border-zinc-900 focus-within:bg-white">
              <Lock size={16} className="text-zinc-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="••••••••"
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="text-zinc-400 transition-colors hover:text-zinc-700"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>

          {isDev && (
            <div className="mt-2 flex flex-col gap-2 border-t border-zinc-100 pt-4">
              <p className="text-center text-xs text-zinc-400">Login rápido (dev)</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleDemoLogin(account.email)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 disabled:opacity-50"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

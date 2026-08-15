"use client";

import { HeartPulse, Phone, Users } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch, fetchMe } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

const PROFILE_LABEL: Record<string, string> = {
  ROOT: "Root",
  COORDENACAO_GERAL: "Coordenação Geral",
  COORDENADOR: "Coordenador",
  MEMBRO: "Membro",
};

interface Social {
  id: string;
  platform: string;
  url: string;
}

interface Family {
  id: string;
  name: string;
  relationship: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

interface MemberDetail {
  id: string;
  userId: string;
  fullName: string;
  photoUrl: string | null;
  phone: string | null;
  birthDate: string | null;
  city: string | null;
  state: string | null;
  user: { email: string; profileLevel: string; isActive: boolean };
  socials: Social[];
  familyMembers: Family[];
  emergencyContacts: EmergencyContact[];
}

function toDateInputValue(value: string) {
  return value.slice(0, 10);
}

export default function MemberDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [member, setMember] = useState<MemberDetail | null | "not-found">(null);
  const [canManageAccount, setCanManageAccount] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);

  function load() {
    apiFetch(`/members/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setMember)
      .catch(() => setMember("not-found"));
  }

  useEffect(load, [params.id]);

  useEffect(() => {
    fetchMe().then((me) => {
      setCanManageAccount(me?.profileLevel === "ROOT" || me?.profileLevel === "COORDENACAO_GERAL");
    });
  }, []);

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);
    const birthDate = form.get("birthDate");

    const response = await apiFetch(`/members/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.get("fullName"),
        phone: form.get("phone") || undefined,
        city: form.get("city") || undefined,
        state: form.get("state") || undefined,
        photoUrl: form.get("photoUrl") || undefined,
        birthDate: birthDate ? new Date(String(birthDate)).toISOString() : undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar as alterações");
      return;
    }

    router.push("/membros");
  }

  async function handleAccountChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountMessage(null);
    if (member === "not-found" || !member) return;
    const form = new FormData(event.currentTarget);

    const response = await apiFetch(`/users/${member.userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileLevel: form.get("profileLevel"),
        isActive: form.get("isActive") === "on",
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setAccountMessage(data?.message ?? "Não foi possível atualizar a conta");
      return;
    }

    setAccountMessage("Conta atualizada com sucesso.");
    load();
  }

  if (member === "not-found") {
    return (
      <main className="px-8 py-8">
        <Link href="/membros" className="text-sm text-zinc-400 hover:text-zinc-700">← Membros</Link>
        <p className="mt-6 text-sm text-zinc-500">Membro não encontrado.</p>
      </main>
    );
  }

  if (!member) {
    return (
      <main className="px-8 py-8">
        <Link href="/membros" className="text-sm text-zinc-400 hover:text-zinc-700">← Membros</Link>
        <p className="mt-6 text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  return (
    <main className="px-8 py-8">
      <Link href="/membros" className="text-sm text-zinc-400 hover:text-zinc-700">← Membros</Link>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{member.fullName}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 rounded-2xl border border-zinc-100 p-6">
            <p className="text-sm font-semibold text-zinc-900">Dados pessoais</p>
            <ImageUpload name="photoUrl" label="Foto" defaultValue={member.photoUrl} shape="circle" />
            <label className="flex flex-col gap-1 text-sm text-zinc-600">
              Nome completo
              <input name="fullName" defaultValue={member.fullName} required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                Telefone
                <input name="phone" defaultValue={member.phone ?? ""} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                Data de nascimento
                <input
                  type="date"
                  name="birthDate"
                  defaultValue={member.birthDate ? toDateInputValue(member.birthDate) : ""}
                  className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                Cidade
                <input name="city" defaultValue={member.city ?? ""} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
              </label>
              <label className="flex flex-col gap-1 text-sm text-zinc-600">
                UF
                <input name="state" defaultValue={member.state ?? ""} maxLength={2} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
              </label>
            </div>
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            <button type="submit" className="mt-1 w-fit rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
              Salvar
            </button>
          </form>

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Users size={15} /> Familiares
            </p>
            {member.familyMembers.length === 0 && <p className="text-sm text-zinc-400">Nenhum familiar cadastrado.</p>}
            {member.familyMembers.map((f) => (
              <p key={f.id} className="text-sm text-zinc-600">{f.name} <span className="text-zinc-400">· {f.relationship}</span></p>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <HeartPulse size={15} /> Contatos de emergência
            </p>
            {member.emergencyContacts.length === 0 && <p className="text-sm text-zinc-400">Nenhum contato cadastrado.</p>}
            {member.emergencyContacts.map((c) => (
              <p key={c.id} className="text-sm text-zinc-600">
                {c.name} <span className="text-zinc-400">{c.relationship ? `· ${c.relationship}` : ""} · {c.phone}</span>
              </p>
            ))}
          </div>

          {member.socials.length > 0 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-zinc-100 p-6">
              <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Phone size={15} /> Redes sociais
              </p>
              {member.socials.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                  {s.platform}: {s.url}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5">
            <p className="text-sm font-semibold text-zinc-900">Conta</p>
            <p className="text-sm text-zinc-600">
              <span className="text-zinc-400">E-mail:</span> {member.user.email}
            </p>

            {canManageAccount ? (
              <form onSubmit={handleAccountChange} className="flex flex-col gap-3">
                <label className="flex flex-col gap-1 text-sm text-zinc-600">
                  Perfil
                  <select name="profileLevel" defaultValue={member.user.profileLevel} className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
                    {Object.entries(PROFILE_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600">
                  <input type="checkbox" name="isActive" defaultChecked={member.user.isActive} className="h-4 w-4 rounded border-zinc-300" />
                  Conta ativa
                </label>
                {accountMessage && <p className="text-sm text-zinc-500">{accountMessage}</p>}
                <button type="submit" className="w-fit rounded-full border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                  Atualizar conta
                </button>
              </form>
            ) : (
              <p className="text-sm text-zinc-500">
                Perfil: {PROFILE_LABEL[member.user.profileLevel] ?? member.user.profileLevel}
                {!member.user.isActive && " · Inativo"}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

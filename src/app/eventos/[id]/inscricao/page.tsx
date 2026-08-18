"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "next/navigation";

import { apiFetch } from "@/lib/auth";
import { Base64ImageInput } from "@/components/Base64ImageInput";

type Status = "idle" | "submitting" | "success" | "error";
type YesNo = "sim" | "nao";

const inputClass =
  "rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-zinc-700";
const checkboxLabelClass =
  "flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-sm text-zinc-700 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50 has-[:checked]:text-amber-800";

interface EventInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string | null;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-zinc-100 pt-8 first:border-t-0 first:pt-0">
      <div className="flex items-center gap-3">
        <span className="h-6 w-1.5 rounded-full bg-amber-500" />
        <div>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function YesNoField({
  legend,
  value,
  onChange,
  required,
  children,
}: {
  legend: string;
  value: YesNo | "";
  onChange: (value: YesNo) => void;
  required?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={labelClass}>
      <span>
        {legend}
        {required && <span className="text-amber-600"> *</span>}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("sim")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            value === "sim"
              ? "border-amber-500 bg-amber-500 text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-amber-300"
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange("nao")}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            value === "nao"
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
          }`}
        >
          Não
        </button>
      </div>
      {value === "sim" && children}
    </div>
  );
}

export default function EventoInscricaoPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;

  const [event, setEvent] = useState<EventInfo | null>(null);
  const [eventStatus, setEventStatus] = useState<"loading" | "ready" | "not-found">("loading");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [usaMedicamento, setUsaMedicamento] = useState<YesNo | "">("");
  const [alergiaMedicamento, setAlergiaMedicamento] = useState<YesNo | "">("");
  const [alergiaAlimentar, setAlergiaAlimentar] = useState<YesNo | "">("");
  const [cuidadoEspecial, setCuidadoEspecial] = useState<YesNo | "">("");
  const [participouMovimento, setParticipouMovimento] = useState<YesNo | "">("");
  const [temParenteNoEncontro, setTemParenteNoEncontro] = useState<YesNo | "">("");
  const [isCasado, setIsCasado] = useState<YesNo | "">("");
  const [temFilhos, setTemFilhos] = useState<YesNo | "">("");

  useEffect(() => {
    if (!eventId) return;
    apiFetch(`/events/${eventId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setEvent(data);
          setEventStatus("ready");
        } else {
          setEventStatus("not-found");
        }
      })
      .catch(() => setEventStatus("not-found"));
  }, [eventId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!usaMedicamento || !alergiaMedicamento || !alergiaAlimentar || !cuidadoEspecial) {
      setStatus("error");
      setErrorMessage("Responda todas as perguntas de saúde obrigatórias.");
      return;
    }

    setStatus("submitting");
    setErrorMessage(null);

    const form = new FormData(event.currentTarget);
    const get = (key: string) => (form.get(key) as string) || undefined;

    const payload = {
      eventId,
      fullName: get("fullName"),
      cpf: get("cpf"),
      email: get("email"),
      phone: get("phone"),
      photoUrl: get("photoUrl") || undefined,
      formData: {
        nomeCracha: get("nomeCracha"),
        sexo: get("sexo"),
        dataNascimento: get("dataNascimento"),
        endereco: {
          rua: get("rua"),
          numero: get("numero"),
          bairro: get("bairro"),
          cidade: get("cidade"),
          cep: get("cep"),
        },
        instagram: get("instagram"),
        escolaridade: get("escolaridade"),
        profissao: get("profissao"),
        sacramentos: {
          batismo: form.get("batismo") === "on",
          eucaristia: form.get("eucaristia") === "on",
          crisma: form.get("crisma") === "on",
          nenhum: form.get("semSacramento") === "on",
        },
        participouMovimento: participouMovimento === "sim",
        quaisMovimentos: participouMovimento === "sim" ? get("quaisMovimentos") : undefined,
        incentivadoPor: get("incentivadoPor"),
        temParenteNoEncontro: temParenteNoEncontro || undefined,
        nomeParentesco: temParenteNoEncontro === "sim" ? get("nomeParentesco") : undefined,
        motivoEncontro: get("motivoEncontro"),
        medicamentoContinuo: {
          usa: usaMedicamento === "sim",
          qual: usaMedicamento === "sim" ? get("qualMedicamento") : undefined,
        },
        alergiaMedicamento: {
          tem: alergiaMedicamento === "sim",
          quais: alergiaMedicamento === "sim" ? get("quaisAlergiaMedicamento") : undefined,
        },
        alergiaAlimentar: {
          tem: alergiaAlimentar === "sim",
          quais: alergiaAlimentar === "sim" ? get("quaisAlergiaAlimentar") : undefined,
        },
        cuidadoEspecial: {
          precisa: cuidadoEspecial === "sim",
          qual: cuidadoEspecial === "sim" ? get("qualCuidadoEspecial") : undefined,
        },
        casado: {
          sim: isCasado === "sim",
          dataCasamento: isCasado === "sim" ? get("dataCasamento") : undefined,
          nomeConjuge: isCasado === "sim" ? get("nomeConjuge") : undefined,
        },
        temFilhos: {
          sim: temFilhos === "sim",
          idades: temFilhos === "sim" ? get("idadesFilhos") : undefined,
          levaraParaKids: temFilhos === "sim" ? get("levaraParaKids") : undefined,
        },
        contatosEmergencia: [
          { nome: get("emergencia1Nome"), telefone: get("emergencia1Telefone") },
          { nome: get("emergencia2Nome"), telefone: get("emergencia2Telefone") },
          { nome: get("emergencia3Nome"), telefone: get("emergencia3Telefone") },
        ].filter((c) => c.nome || c.telefone),
      },
    };

    try {
      const response = await apiFetch("/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message ?? "Não foi possível enviar a inscrição");
      }

      setStatus("success");
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Erro inesperado");
    }
  }

  if (eventStatus === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </main>
    );
  }

  if (eventStatus === "not-found") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 text-center">
        <p className="text-sm text-zinc-500">Este link de inscrição não é válido ou o evento não existe mais.</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-1 bg-zinc-50">
      <div
        className="sticky top-0 hidden h-screen bg-cover bg-center lg:block lg:w-[38%]"
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
            <p className="text-2xl font-light leading-snug">{event?.name}</p>
            {event?.location && <p className="mt-2 text-sm text-white/70">{event.location}</p>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-zinc-900 lg:hidden">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-400/70 text-xs text-amber-500">
              R
            </span>
            RCC
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
            Inscrição — {event?.name}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Preencha os dados com atenção. Todas as informações ajudam a coordenação a te acolher
            melhor no evento.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-6">
            <Section title="Dados pessoais">
              <div className="flex justify-center">
                <Base64ImageInput name="photoUrl" label="Adicionar foto *" required shape="circle" />
              </div>

              <label className={labelClass}>
                Nome completo *
                <input name="fullName" required minLength={3} className={inputClass} />
              </label>

              <label className={labelClass}>
                Qual nome prefere no crachá *
                <input name="nomeCracha" required className={inputClass} />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Sexo *
                  <select name="sexo" required className={inputClass}>
                    <option value="">Selecione</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                  </select>
                </label>

                <label className={labelClass}>
                  Data de nascimento *
                  <input type="date" name="dataNascimento" required className={inputClass} />
                </label>
              </div>
            </Section>

            <Section title="Endereço">
              <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
                <label className={labelClass}>
                  Rua / Avenida *
                  <input name="rua" required className={inputClass} />
                </label>
                <label className={labelClass}>
                  Número *
                  <input name="numero" required className={inputClass} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="bairro" required placeholder="Bairro *" className={inputClass} />
                <input name="cidade" required placeholder="Cidade *" className={inputClass} />
              </div>
              <input name="cep" required placeholder="CEP *" className={inputClass} />
            </Section>

            <Section title="Contato">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClass}>
                  Celular *
                  <input name="phone" required minLength={8} className={inputClass} />
                </label>

                <label className={labelClass}>
                  E-mail *
                  <input type="email" name="email" required className={inputClass} />
                </label>
              </div>

              <label className={labelClass}>
                Instagram / rede social
                <input name="instagram" className={inputClass} />
              </label>
            </Section>

            <Section title="Formação e profissão">
              <label className={labelClass}>
                Grau de escolaridade *
                <select name="escolaridade" required className={inputClass}>
                  <option value="">Selecione</option>
                  <option value="fundamental_incompleto">Fundamental incompleto</option>
                  <option value="fundamental_completo">Fundamental completo</option>
                  <option value="medio_incompleto">Médio incompleto</option>
                  <option value="medio_completo">Médio completo</option>
                  <option value="superior_incompleto">Superior incompleto</option>
                  <option value="superior_completo">Superior completo</option>
                  <option value="pos_graduacao">Pós-graduação</option>
                </select>
              </label>

              <label className={labelClass}>
                Profissão *
                <input name="profissao" required className={inputClass} />
              </label>
            </Section>

            <Section title="Vida de fé" description="Sacramentos e trajetória em outros movimentos.">
              <div className={labelClass}>
                <span>Situação sacramental</span>
                <div className="flex flex-wrap gap-2">
                  <label className={checkboxLabelClass}>
                    <input type="checkbox" name="batismo" /> Batismo
                  </label>
                  <label className={checkboxLabelClass}>
                    <input type="checkbox" name="eucaristia" /> Eucaristia
                  </label>
                  <label className={checkboxLabelClass}>
                    <input type="checkbox" name="crisma" /> Crisma
                  </label>
                  <label className={checkboxLabelClass}>
                    <input type="checkbox" name="semSacramento" /> Nenhum
                  </label>
                </div>
              </div>

              <YesNoField
                legend="Já participou de algum movimento de igreja?"
                value={participouMovimento}
                onChange={setParticipouMovimento}
              >
                <input name="quaisMovimentos" placeholder="Quais?" className={`${inputClass} mt-2`} />
              </YesNoField>

              <label className={labelClass}>
                Quem te incentivou a participar do encontro?
                <input name="incentivadoPor" className={inputClass} />
              </label>

              <YesNoField
                legend="Você tem parentes ou amigos que já fizeram esse encontro?"
                value={temParenteNoEncontro}
                onChange={setTemParenteNoEncontro}
              >
                <input
                  name="nomeParentesco"
                  placeholder="Nome e grau de parentesco"
                  className={`${inputClass} mt-2`}
                />
              </YesNoField>

              <label className={labelClass}>
                Por que você deseja fazer esse encontro?
                <textarea name="motivoEncontro" className={inputClass} rows={3} />
              </label>
            </Section>

            <Section title="Saúde" description="Informações importantes para a equipe de cuidado.">
              <YesNoField
                legend="Você usa algum medicamento de forma contínua por indicação médica?"
                value={usaMedicamento}
                onChange={setUsaMedicamento}
                required
              >
                <input name="qualMedicamento" placeholder="Qual?" className={`${inputClass} mt-2`} />
              </YesNoField>

              <YesNoField
                legend="Você tem restrição/alergia a medicamentos?"
                value={alergiaMedicamento}
                onChange={setAlergiaMedicamento}
                required
              >
                <input
                  name="quaisAlergiaMedicamento"
                  placeholder="Quais?"
                  className={`${inputClass} mt-2`}
                />
              </YesNoField>

              <YesNoField
                legend="Você tem restrição/alergia alimentar?"
                value={alergiaAlimentar}
                onChange={setAlergiaAlimentar}
                required
              >
                <input
                  name="quaisAlergiaAlimentar"
                  placeholder="Quais?"
                  className={`${inputClass} mt-2`}
                />
              </YesNoField>

              <YesNoField
                legend="Você necessita de cuidado especial?"
                value={cuidadoEspecial}
                onChange={setCuidadoEspecial}
                required
              >
                <input name="qualCuidadoEspecial" placeholder="Qual?" className={`${inputClass} mt-2`} />
              </YesNoField>
            </Section>

            <Section title="Situação familiar">
              <YesNoField legend="Você é casado? *" value={isCasado} onChange={setIsCasado}>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className={labelClass}>
                    Data do casamento
                    <input type="date" name="dataCasamento" className={inputClass} />
                  </label>
                  <label className={labelClass}>
                    Nome do cônjuge
                    <input name="nomeConjuge" className={inputClass} />
                  </label>
                </div>
              </YesNoField>

              <YesNoField legend="Você tem filhos? *" value={temFilhos} onChange={setTemFilhos}>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <input
                    name="idadesFilhos"
                    placeholder="Idade dos filhos"
                    className={inputClass}
                  />
                  <select name="levaraParaKids" className={inputClass}>
                    <option value="">Levará para a equipe Kids?</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>
              </YesNoField>
            </Section>

            <Section
              title="Contatos de emergência"
              description="Até 3 contatos que não estarão no local do evento."
            >
              {[1, 2, 3].map((n) => (
                <div key={n} className="grid gap-4 sm:grid-cols-2">
                  <input
                    name={`emergencia${n}Nome`}
                    required={n === 1}
                    placeholder={`Contato de emergência ${n} — nome${n === 1 ? " *" : ""}`}
                    className={inputClass}
                  />
                  <input
                    name={`emergencia${n}Telefone`}
                    required={n === 1}
                    placeholder={`Contato de emergência ${n} — telefone${n === 1 ? " *" : ""}`}
                    className={inputClass}
                  />
                </div>
              ))}
            </Section>

            {status === "success" && (
              <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Inscrição enviada com sucesso! A coordenação irá analisar seus dados.
              </p>
            )}

            {status === "error" && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="rounded-full bg-amber-500 px-6 py-3.5 text-base font-semibold text-zinc-900 shadow-sm transition-colors hover:bg-amber-400 disabled:opacity-50"
            >
              {status === "submitting" ? "Enviando..." : "Enviar inscrição"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

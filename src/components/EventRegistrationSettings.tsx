"use client";

import { ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

type FieldMode = "hidden" | "optional" | "required";

interface FieldInfo {
  key: string;
  label: string;
  section: string;
  default: FieldMode;
}

interface ItemDraft {
  id?: string;
  name: string;
  description: string;
  images: string[];
  // Texto livre "P, M, G" no formulário; vira lista ao salvar.
  options: string;
  price: string;
  maxPerPerson: string;
  isActive: boolean;
}

interface Settings {
  registrationFee: number;
  pixKey: string | null;
  pixReceiverName: string | null;
  pixCity: string | null;
  formConfig: Record<string, FieldMode>;
  fields: FieldInfo[];
  items: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
    options: string[];
    price: number;
    maxPerPerson: number | null;
    isActive: boolean;
  }[];
}

const MODE_OPTIONS: { value: FieldMode; label: string }[] = [
  { value: "hidden", label: "Não aparece" },
  { value: "optional", label: "Opcional" },
  { value: "required", label: "Obrigatório" },
];

const inputClass = "rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900";

// Aceita "50", "50,00" ou "1.234,56".
function parseMoney(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : NaN;
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toDraft(item: Settings["items"][number]): ItemDraft {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    images: item.images,
    options: item.options.join(", "),
    price: formatMoney(item.price),
    maxPerPerson: item.maxPerPerson ? String(item.maxPerPerson) : "",
    isActive: item.isActive,
  };
}

// Configuração da inscrição do evento: valor, Pix, itens extras e campos do formulário.
// Só aparece para coordenação geral / root (a API também restringe).
export function EventRegistrationSettings({ eventId }: { eventId: string }) {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [fee, setFee] = useState("0,00");
  const [pixKey, setPixKey] = useState("");
  const [pixReceiverName, setPixReceiverName] = useState("");
  const [pixCity, setPixCity] = useState("");
  const [formConfig, setFormConfig] = useState<Record<string, FieldMode>>({});
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<"pagamento" | "itens" | "campos">("pagamento");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function apply(settings: Settings) {
    setFields(settings.fields);
    setFee(formatMoney(settings.registrationFee));
    setPixKey(settings.pixKey ?? "");
    setPixReceiverName(settings.pixReceiverName ?? "");
    setPixCity(settings.pixCity ?? "");
    setFormConfig(settings.formConfig);
    setItems(settings.items.map(toDraft));
  }

  useEffect(() => {
    apiFetch(`/events/${eventId}/registration-settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Settings | null) => {
        if (data) apply(data);
        setLoaded(true);
      });
  }, [eventId]);

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  // Envia as fotos uma a uma e acrescenta ao item (máx. 10 por item).
  async function addImages(index: number, files: File[]) {
    setUploadingIndex(index);
    setMessage(null);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiFetch("/uploads", { method: "POST", body: formData });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          setMessage({ type: "error", text: data?.message ?? "Falha ao enviar a foto." });
          return;
        }
        setItems((current) =>
          current.map((item, i) => (i === index ? { ...item, images: [...item.images, data.url].slice(0, 10) } : item)),
        );
      }
    } finally {
      setUploadingIndex(null);
    }
  }

  async function handleSave() {
    setMessage(null);

    const registrationFee = parseMoney(fee);
    if (Number.isNaN(registrationFee)) {
      setMessage({ type: "error", text: "Valor da inscrição inválido." });
      return;
    }
    const parsedItems = [];
    for (const item of items) {
      const price = parseMoney(item.price);
      if (item.name.trim().length < 2 || Number.isNaN(price)) {
        setMessage({ type: "error", text: "Cada item precisa de nome e preço válidos." });
        return;
      }
      parsedItems.push({
        id: item.id,
        name: item.name.trim(),
        description: item.description.trim() || null,
        images: item.images,
        options: item.options
          .split(",")
          .map((o) => o.trim())
          .filter(Boolean),
        price,
        maxPerPerson: item.maxPerPerson ? Math.max(1, Number(item.maxPerPerson)) : null,
        isActive: item.isActive,
      });
    }

    setSaving(true);
    try {
      const response = await apiFetch(`/events/${eventId}/registration-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationFee,
          pixKey: pixKey.trim() || null,
          pixReceiverName: pixReceiverName.trim() || null,
          pixCity: pixCity.trim() || null,
          formConfig,
          items: parsedItems,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage({ type: "error", text: data?.message ?? "Não foi possível salvar." });
        return;
      }
      apply(data);
      setMessage({ type: "ok", text: "Configuração salva." });
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return null;

  const sections = [...new Set(fields.map((f) => f.section))];
  const isPaid = parseMoney(fee) > 0 || items.some((i) => parseMoney(i.price) > 0);

  return (
    <section className="mt-8 max-w-3xl rounded-2xl border border-zinc-100 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Inscrição e pagamento</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Valor, Pix, itens extras e campos que aparecem no formulário de inscrição deste evento.
      </p>

      <div role="tablist" aria-label="Configuração da inscrição" className="mt-4 flex w-fit gap-1 rounded-full bg-zinc-100 p-1">
        {(
          [
            ["pagamento", "Valor e Pix"],
            ["itens", `Itens${items.length ? ` (${items.length})` : ""}`],
            ["campos", "Campos do formulário"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={subTab === key}
            onClick={() => setSubTab(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              subTab === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Valor e Pix */}
      <div role="tabpanel" className={subTab === "pagamento" ? "mt-5 grid gap-4 sm:grid-cols-2" : "hidden"}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Valor da inscrição (R$)
          <input value={fee} onChange={(e) => setFee(e.target.value)} inputMode="decimal" className={inputClass} />
          <span className="text-xs font-normal text-zinc-400">0,00 = inscrição gratuita</span>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Chave Pix {isPaid && <span className="text-red-500">*</span>}
          <input
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Nome do recebedor
          <input
            value={pixReceiverName}
            onChange={(e) => setPixReceiverName(e.target.value)}
            placeholder="Como aparece no app do banco"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700">
          Cidade do recebedor
          <input value={pixCity} onChange={(e) => setPixCity(e.target.value)} className={inputClass} />
        </label>
      </div>

      {/* Itens extras */}
      <div role="tabpanel" className={subTab === "itens" ? "mt-5" : "hidden"}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Itens extras (ex.: kit)</p>
        <p className="mt-1 text-xs text-zinc-500">
          Quem se inscreve escolhe os itens, o tamanho e a quantidade; o valor soma ao da inscrição. Cada item pode ter
          até 10 fotos.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {items.map((item, index) => (
            <div
              key={item.id ?? `novo-${index}`}
              className={`flex flex-col gap-3 rounded-xl border border-zinc-100 p-3 ${item.isActive ? "" : "opacity-60"}`}
            >
            <div className="grid items-center gap-2 sm:grid-cols-[1.2fr_1.5fr_100px_90px_auto]">
              <input
                value={item.name}
                onChange={(e) => updateItem(index, { name: e.target.value })}
                placeholder="Nome (ex.: Kit)"
                aria-label="Nome do item"
                className={inputClass}
              />
              <input
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                placeholder="Descrição (opcional)"
                aria-label="Descrição do item"
                className={inputClass}
              />
              <input
                value={item.price}
                onChange={(e) => updateItem(index, { price: e.target.value })}
                inputMode="decimal"
                placeholder="Preço"
                aria-label="Preço do item"
                className={inputClass}
              />
              <input
                value={item.maxPerPerson}
                onChange={(e) => updateItem(index, { maxPerPerson: e.target.value.replace(/\D/g, "") })}
                inputMode="numeric"
                placeholder="Máx."
                title="Quantidade máxima por pessoa (vazio = sem limite)"
                aria-label="Quantidade máxima por pessoa"
                className={inputClass}
              />
              <div className="flex items-center gap-1">
                <label className="flex items-center gap-1.5 px-1 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateItem(index, { isActive: e.target.checked })}
                  />
                  Ativo
                </label>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                  aria-label="Remover item"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {item.images.map((url) => (
                <div key={url} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-zinc-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateItem(index, { images: item.images.filter((u) => u !== url) })}
                    aria-label="Remover foto"
                    className="absolute inset-0 flex items-center justify-center bg-black/55 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {item.images.length < 10 && (
                <label
                  className="flex h-14 w-14 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 hover:border-zinc-400 hover:text-zinc-600"
                  title="Adicionar foto"
                >
                  {uploadingIndex === index ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}
                  <span className="text-[10px]">Foto</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    className="hidden"
                    disabled={uploadingIndex !== null}
                    onChange={(e) => {
                      const files = [...(e.target.files ?? [])];
                      e.target.value = "";
                      if (files.length) addImages(index, files);
                    }}
                  />
                </label>
              )}
              <label className="ml-auto flex min-w-60 flex-1 flex-col gap-1 text-xs text-zinc-500 sm:max-w-sm">
                Tamanhos / opções (separe por vírgula)
                <input
                  value={item.options}
                  onChange={(e) => updateItem(index, { options: e.target.value })}
                  placeholder="Ex.: P, M, G, GG — vazio = sem opções"
                  aria-label="Tamanhos ou opções do item"
                  className={inputClass}
                />
              </label>
            </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setItems((current) => [
                ...current,
                { name: "", description: "", images: [], options: "", price: "", maxPerPerson: "", isActive: true },
              ])
            }
            className="flex w-fit items-center gap-1.5 rounded-full border border-dashed border-zinc-300 px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:border-zinc-400"
          >
            <Plus size={14} /> Adicionar item
          </button>
        </div>
      </div>

      {/* Campos do formulário */}
      <div role="tabpanel" className={subTab === "campos" ? "mt-5" : "hidden"}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Campos do formulário</p>
        <p className="mt-1 text-xs text-zinc-500">Nome completo, e-mail e celular sempre aparecem e são obrigatórios.</p>
        <div className="mt-3 flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section}>
              <p className="text-xs font-semibold text-zinc-700">{section}</p>
              <div className="mt-1.5 flex flex-col divide-y divide-zinc-50 rounded-xl border border-zinc-100">
                {fields
                  .filter((f) => f.section === section)
                  .map((field) => (
                    <div key={field.key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                      <span className="text-sm text-zinc-800">{field.label}</span>
                      <div className="flex rounded-full bg-zinc-100 p-0.5" role="radiogroup" aria-label={field.label}>
                        {MODE_OPTIONS.map((option) => {
                          const active = formConfig[field.key] === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              onClick={() => setFormConfig((c) => ({ ...c, [field.key]: option.value }))}
                              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                active
                                  ? option.value === "hidden"
                                    ? "bg-white text-zinc-500 shadow-sm"
                                    : option.value === "required"
                                      ? "bg-zinc-900 text-white"
                                      : "bg-white text-zinc-900 shadow-sm"
                                  : "text-zinc-400 hover:text-zinc-700"
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Salvando..." : "Salvar configuração"}
        </button>
        {message && (
          <span className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</span>
        )}
      </div>
    </section>
  );
}

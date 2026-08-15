"use client";

import { Paperclip, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { apiFetch } from "@/lib/auth";
import { ImageUpload } from "@/components/ImageUpload";

interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: string;
  description: string | null;
  occurredAt: string;
  receiptUrl: string | null;
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function load() {
    apiFetch("/financial-transactions")
      .then((res) => (res.ok ? res.json() : []))
      .then(setTransactions);
  }

  useEffect(load, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const form = new FormData(event.currentTarget);

    const response = await apiFetch("/financial-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"),
        category: form.get("category"),
        amount: Number(form.get("amount")),
        description: form.get("description") || undefined,
        occurredAt: new Date(String(form.get("occurredAt"))).toISOString(),
        receiptUrl: form.get("receiptUrl") || undefined,
      }),
    });

    if (!response.ok) {
      setErrorMessage("Não foi possível salvar o lançamento");
      return;
    }

    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Excluir este lançamento?")) return;
    await apiFetch(`/financial-transactions/${id}`, { method: "DELETE" });
    load();
  }

  const totals = (transactions ?? []).reduce(
    (acc, t) => {
      const amount = Number(t.amount);
      if (t.type === "INCOME") acc.income += amount;
      else acc.expense += amount;
      return acc;
    },
    { income: 0, expense: 0 },
  );

  return (
    <main className="px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Financeiro</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancelar" : "Novo lançamento"}
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-5 py-4">
          <p className="text-sm text-zinc-500">Entradas</p>
          <p className="mt-2 text-xl font-semibold text-green-700">{formatCurrency(totals.income)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-5 py-4">
          <p className="text-sm text-zinc-500">Saídas</p>
          <p className="mt-2 text-xl font-semibold text-red-700">{formatCurrency(totals.expense)}</p>
        </div>
        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-5 py-4">
          <p className="text-sm text-zinc-500">Saldo</p>
          <p className="mt-2 text-xl font-semibold text-zinc-900">{formatCurrency(totals.income - totals.expense)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-100 p-5 sm:max-w-md">
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Tipo
            <select name="type" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900">
              <option value="INCOME">Entrada</option>
              <option value="EXPENSE">Saída</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Categoria
            <input name="category" required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Valor (R$)
            <input type="number" name="amount" step="0.01" min="0.01" required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Data
            <input type="date" name="occurredAt" required className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-600">
            Descrição
            <input name="description" className="rounded-md border border-zinc-200 px-3 py-2 text-zinc-900" />
          </label>
          <ImageUpload name="receiptUrl" label="Comprovante (imagem)" />
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          <button type="submit" className="mt-1 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800">
            Salvar lançamento
          </button>
        </form>
      )}

      {transactions === null && <p className="mt-6 text-sm text-zinc-500">Carregando...</p>}
      {transactions?.length === 0 && <p className="mt-6 text-sm text-zinc-500">Nenhum lançamento registrado.</p>}

      {transactions && transactions.length > 0 && (
        <div className="mt-6 flex flex-col divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-5 py-4">
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${t.type === "INCOME" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {t.type === "INCOME" ? "Entrada" : "Saída"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900">{t.category}</p>
                <p className="text-sm text-zinc-500">{formatDate(t.occurredAt)}{t.description ? ` · ${t.description}` : ""}</p>
              </div>
              <p className={`text-sm font-medium ${t.type === "INCOME" ? "text-green-700" : "text-red-700"}`}>
                {formatCurrency(Number(t.amount))}
              </p>
              {t.receiptUrl && (
                <a
                  href={t.receiptUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <Paperclip size={15} />
                </a>
              )}
              <button type="button" onClick={() => handleDelete(t.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-red-50 hover:text-red-600">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

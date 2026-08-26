"use client";

import { Eye, Newspaper } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/auth";

interface NewsItem {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  coverImageUrl: string | null;
  publishedAt: string | null;
  viewCount: number;
  category: { name: string };
  author: { email: string; member: { fullName: string } | null };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function LerNoticiaPage() {
  const params = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsItem | null | "not-found">(null);

  useEffect(() => {
    apiFetch("/news")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: NewsItem[]) => {
        const found = all.find((item) => item.id === params.id);
        setNews(found ?? "not-found");
      });
  }, [params.id]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <Link href="/noticias" className="text-sm text-slate-400 hover:text-slate-700">
        ← Notícias
      </Link>

      {news === null && <p className="text-sm text-slate-500">Carregando...</p>}
      {news === "not-found" && <p className="text-sm text-slate-500">Notícia não encontrada.</p>}

      {news && news !== "not-found" && (
        <>
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full bg-primary-100 px-2.5 py-1 text-xs font-medium text-primary-700">
              {news.category?.name ?? "Sem categoria"}
            </span>
            <h1 className="text-3xl font-extrabold uppercase tracking-tighter text-slate-900">{news.title}</h1>
            {news.subtitle && <p className="text-base leading-7 text-slate-500">{news.subtitle}</p>}
            <p className="flex items-center gap-3 text-sm text-slate-500">
              {news.author.member?.fullName ?? news.author.email}
              {news.publishedAt && (
                <>
                  <span>·</span>
                  {formatDate(news.publishedAt)}
                </>
              )}
              <span className="flex items-center gap-1">
                <Eye size={13} /> {news.viewCount}
              </span>
            </p>
          </div>

          {news.coverImageUrl && (
            <div className="relative flex h-[320px] justify-center overflow-hidden rounded-2xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={news.coverImageUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={news.coverImageUrl} alt={news.title} className="relative h-full w-auto max-w-full object-contain" />
            </div>
          )}

          {!news.coverImageUrl && (
            <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Newspaper size={28} />
            </div>
          )}

          <div
            className="flex flex-col gap-4 text-base leading-7 text-slate-700 [&_a]:text-primary-600 [&_a]:underline [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: news.content }}
          />
        </>
      )}
    </main>
  );
}

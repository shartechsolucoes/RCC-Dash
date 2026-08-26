"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { apiFetch, fetchMe, type CurrentUser } from "@/lib/auth";
import { hasAccess, TOP_ROLES } from "@/lib/permissions";
import { MuralPostForm } from "@/components/MuralPostForm";

interface Post {
  id: string;
  title: string | null;
  content: string;
  imageUrl: string | null;
  eventDate: string | null;
  isPublic: boolean;
  author: { email: string };
}

export default function EditarAvisoPage() {
  const params = useParams<{ id: string }>();
  const postId = params.id;

  const [post, setPost] = useState<Post | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    fetchMe().then(setUser);
  }, []);

  useEffect(() => {
    if (!postId) return;
    apiFetch("/mural")
      .then((res) => (res.ok ? res.json() : []))
      .then((all: Post[]) => {
        const found = all.find((p) => p.id === postId);
        if (found) setPost(found);
        else setNotFound(true);
      });
  }, [postId]);

  const canPublish = hasAccess(user?.profileLevel, TOP_ROLES);
  const isTopManager = hasAccess(user?.profileLevel, TOP_ROLES);
  const canEdit = Boolean(post && user) && (isTopManager || post?.author.email === user?.email);

  return (
    <main className="flex flex-col gap-6 px-4 py-8 sm:px-8">
      <div>
        <Link href="/mural" className="text-sm text-slate-400 hover:text-slate-700">
          ← Mural
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Editar aviso</h1>
      </div>

      {notFound && <p className="text-sm text-slate-500">Postagem não encontrada.</p>}
      {!notFound && !post && <p className="text-sm text-slate-500">Carregando...</p>}
      {post && !canEdit && (
        <p className="text-sm text-slate-500">Você não tem permissão para editar esta postagem.</p>
      )}
      {post && canEdit && <MuralPostForm post={post} canPublish={canPublish} />}
    </main>
  );
}

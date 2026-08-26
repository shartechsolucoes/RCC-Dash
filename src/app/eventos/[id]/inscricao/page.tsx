import { redirect } from "next/navigation";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function EventoInscricaoRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`${SITE_URL}/eventos/${id}/inscricao`);
}

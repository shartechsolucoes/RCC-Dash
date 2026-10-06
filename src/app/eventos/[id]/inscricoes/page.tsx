"use client";

import { useParams } from "next/navigation";

import { EventRegistrations } from "@/components/EventRegistrations";

// A tela também aparece como aba "Inscritos" na página do evento.
export default function EventoInscricoesPage() {
  const params = useParams<{ id: string }>();
  return <EventRegistrations eventId={params.id} />;
}

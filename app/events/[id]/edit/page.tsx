import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent, getUserGyms } from "@/lib/queries/events";
import { EditEventPageClient } from "./EditEventPageClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/events/${id}/edit`);

  const { data: event, error } = await getEvent(id);
  if (error || !event) notFound();

  const gym = event.gyms as { owner_id: string } | null;
  if (!gym || gym.owner_id !== user.id) {
    redirect(`/events/${id}`);
  }

  const { data: gyms } = await getUserGyms(user.id);

  return <EditEventPageClient event={event} gyms={gyms ?? []} />;
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getEvent } from "@/lib/queries/events";
import { buildHostParticipantsUrl } from "@/lib/utils/host-participants-url";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ParticipantsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: event, error } = await getEvent(id);
  if (error || !event) redirect("/host/participants");

  const gym = event.gyms as { owner_id: string } | null;
  if (!gym || gym.owner_id !== user.id) {
    redirect(`/events/${id}`);
  }

  redirect(buildHostParticipantsUrl(event.gym_id, id));
}

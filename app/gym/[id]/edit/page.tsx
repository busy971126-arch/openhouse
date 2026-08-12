import EditGymForm from "./EditGymForm";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function GymEditPage({ params }: PageProps) {
  const { id } = await params;
  return <EditGymForm gymId={id} />;
}

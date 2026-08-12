import { UserProfileContent } from "@/components/profile/UserProfileContent";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicUserProfilePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <UserProfileContent
      userId={id}
      backHref="/"
      backLabel="← 홈"
    />
  );
}

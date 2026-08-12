import Link from "next/link";

type ParticipantProfileLinkProps = {
  userId: string | null | undefined;
  className?: string;
  children?: React.ReactNode;
};

export function ParticipantProfileLink({
  userId,
  className,
  children,
}: ParticipantProfileLinkProps) {
  if (!userId) return null;

  return (
    <Link
      href={`/users/${userId}`}
      className={
        className ??
        "text-sm font-medium text-orange-600 hover:text-orange-700"
      }
    >
      {children ?? "프로필 보기"}
    </Link>
  );
}

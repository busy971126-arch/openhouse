import Link from "next/link";

type HeaderProps = {
  isLoggedIn: boolean;
};

export function Header({ isLoggedIn }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-orange-600">
          OpenHouse
        </Link>
        {!isLoggedIn && (
          <Link
            href="/login"
            className="rounded-full bg-orange-600 px-3 py-1.5 text-sm text-white hover:bg-orange-700"
          >
            로그인
          </Link>
        )}
      </div>
    </header>
  );
}

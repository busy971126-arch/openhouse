type GymContactLinksProps = {
  phone: string | null | undefined;
  instagramUrl: string | null | undefined;
  instagramHandle: string | null;
  showPhone?: boolean;
};

export function GymContactLinks({
  phone,
  instagramUrl,
  instagramHandle,
  showPhone = true,
}: GymContactLinksProps) {
  const phoneTrimmed = showPhone ? phone?.trim() : "";
  const instagramTrimmed = instagramUrl?.trim();
  const hasInstagram = !!instagramHandle && !!instagramTrimmed;

  if (!phoneTrimmed && !hasInstagram) return null;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {phoneTrimmed && (
        <a
          href={`tel:${phoneTrimmed}`}
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/50"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm"
            aria-hidden
          >
            📞
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500">문의 전화</p>
            <p className="mt-0.5 font-semibold text-zinc-900">{phoneTrimmed}</p>
          </div>
          <span className="shrink-0 text-sm text-orange-600">전화</span>
        </a>
      )}

      {hasInstagram && (
        <a
          href={instagramTrimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/50"
        >
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm"
            aria-hidden
          >
            📷
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-500">Instagram</p>
            <p className="mt-0.5 truncate font-semibold text-zinc-900">
              {instagramHandle}
            </p>
          </div>
          <span className="shrink-0 text-sm text-orange-600">보기</span>
        </a>
      )}
    </div>
  );
}

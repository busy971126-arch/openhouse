"use client";

import { useMemo, useState } from "react";
import { ProfilePhotoUpload } from "@/components/profile/ProfilePhotoUpload";
import {
  filterProfileFeedItems,
  type ProfileFeedItem,
} from "@/lib/utils/profile-feed";

type FeedTab = "all" | "photo" | "event" | "competition";

const FEED_TABS: { value: FeedTab; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "photo", label: "사진" },
  { value: "event", label: "이벤트" },
  { value: "competition", label: "대회" },
];

type ProfileFeedProps = {
  items: ProfileFeedItem[];
  canUpload?: boolean;
  userId?: string;
};

function collectPhotoUrls(items: ProfileFeedItem[]): string[] {
  return items.flatMap((item) =>
    item.kind === "photo" ? (item.photoUrls ?? []) : [],
  );
}

function PhotoGrid({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1">
      {urls.map((url) => (
        <div
          key={url}
          className="relative aspect-square overflow-hidden rounded-md bg-zinc-100"
        >
          <img
            src={url}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

export function ProfileFeed({ items, canUpload, userId }: ProfileFeedProps) {
  const [tab, setTab] = useState<FeedTab>("all");

  const visible = useMemo(
    () => filterProfileFeedItems(items, tab),
    [items, tab],
  );

  const photoGridUrls = useMemo(
    () => collectPhotoUrls(filterProfileFeedItems(items, "photo")),
    [items],
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">운동 피드</h2>
      <p className="mt-1 text-xs text-zinc-500">
        참가·운영 기록과 운동 사진이 쌓입니다.
      </p>

      {canUpload && userId && <ProfilePhotoUpload userId={userId} />}

      <div className="mt-4 flex gap-1 rounded-lg bg-zinc-100 p-1">
        {FEED_TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${
              tab === item.value
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "photo" ? (
        photoGridUrls.length === 0 ? (
          <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
            {canUpload
              ? "운동 사진을 올리면 여기에 표시됩니다."
              : "아직 운동 사진이 없습니다."}
          </p>
        ) : (
          <div className="mt-4">
            <PhotoGrid urls={photoGridUrls} />
          </div>
        )
      ) : visible.length === 0 ? (
        <p className="mt-4 rounded-lg bg-zinc-50 px-3 py-6 text-center text-sm text-zinc-500">
          {tab === "all"
            ? "아직 운동 기록이 없습니다. 이벤트에 참가하면 자동으로 추가됩니다."
            : "해당 기록이 없습니다."}
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100">
          {visible.map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-lg"
                  aria-hidden
                >
                  {item.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">{item.dateLabel}</p>
                  <p className="mt-0.5 text-sm font-medium text-zinc-900">
                    {item.title}
                  </p>
                </div>
              </div>
              {item.kind === "photo" && item.photoUrls?.length ? (
                <div className="mt-3 pl-[52px]">
                  <PhotoGrid urls={item.photoUrls} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

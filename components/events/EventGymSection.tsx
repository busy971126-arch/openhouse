"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Gym } from "@/lib/types/database";
import {
  formatDaysLabel,
  groupClassSchedule,
  parseClassSchedule,
} from "@/lib/utils/class-schedule";
import { getMapSearchUrl } from "@/lib/utils/date";
import { sortFacilitiesForDisplay } from "@/lib/utils/gym-facility-display";
import { collectGymDisplayPhotos } from "@/lib/utils/gym-display-photos";
import { formatInstagramHandle } from "@/lib/utils/social";
import { GymPhotoCarousel } from "@/components/gym/GymPhotoCarousel";
import { GymAddressCopy } from "@/components/gym/GymAddressCopy";
import { GymContactLinks } from "@/components/gym/GymContactLinks";
import {
  GymOtherEventsList,
  type GymOtherUpcomingEvent,
} from "@/components/gym/GymOtherEventsList";
import { InterestHeart } from "@/components/interest/InterestHeart";
import { AppIcon } from "@/components/ui/AppIcon";

type EventGymSectionProps = {
  gym: Pick<
    Gym,
    | "id"
    | "name"
    | "sport"
    | "region"
    | "address"
    | "photo_url"
    | "phone"
    | "instagram_url"
    | "homepage_url"
    | "description"
    | "facilities"
    | "facility_notes"
    | "class_schedule"
    | "operating_hours"
    | "closed_days"
    | "preparation_guide"
    | "mat_photos"
    | "facility_photos"
    | "exterior_photos"
    | "parking_photos"
  >;
  userId: string | null;
  isFollowed: boolean;
  loginRedirect: string;
  showFollow?: boolean;
  variant?: "event" | "gym";
  defaultExpanded?: boolean;
  preview?: boolean;
  otherUpcomingEvents?: GymOtherUpcomingEvent[];
};

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-zinc-200 pt-4">
      <p className="text-[10px] font-black tracking-[0.14em] text-zinc-400">
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function EventGymSection({
  gym,
  userId,
  isFollowed,
  loginRedirect,
  showFollow = true,
  variant = "gym",
  defaultExpanded = false,
  preview = false,
  otherUpcomingEvents = [],
}: EventGymSectionProps) {
  const isEventVariant = variant === "event";
  const [expanded, setExpanded] = useState(defaultExpanded || preview);
  const schedule = groupClassSchedule(parseClassSchedule(gym.class_schedule));
  const facilities = sortFacilitiesForDisplay(gym.facilities);
  const instagramHandle = formatInstagramHandle(gym.instagram_url);
  const displayPhotos = collectGymDisplayPhotos(gym);

  const hasFacilityDetails =
    facilities.length > 0 || !!gym.facility_notes?.trim();

  const hasMore =
    !!gym.homepage_url ||
    hasFacilityDetails ||
    schedule.length > 0 ||
    !!gym.operating_hours?.trim() ||
    !!gym.closed_days?.trim();

  const hasContact =
    !!gym.phone?.trim() || (!!instagramHandle && !!gym.instagram_url?.trim());

  const locationLine = gym.address?.trim() || gym.region;

  return (
    <section className={isEventVariant ? "border-t border-zinc-300 pt-5" : ""}>
      {isEventVariant && (
        <div className="mb-4">
          <p className="text-[10px] font-black tracking-[0.16em] text-zinc-400">
            HOST GYM
          </p>
        </div>
      )}

      {!isEventVariant && showFollow && !preview && (
        <div className="mb-3 flex justify-end">
          <InterestHeart
            kind="gym"
            targetId={gym.id}
            initialInterested={isFollowed}
            userId={userId}
            loginRedirect={loginRedirect}
            size="sm"
          />
        </div>
      )}

      <div className="overflow-hidden bg-zinc-100">
        <GymPhotoCarousel
          photos={displayPhotos}
          alt={gym.name}
          aspect="portrait"
          showPhotoLabels
          dotPosition="raised"
        />
      </div>

      <div className="pt-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-600">
              {gym.sport ?? "유도"}
            </p>
            {isEventVariant || preview ? (
              <h2 className="mt-1 truncate text-xl font-black tracking-[-0.025em] text-zinc-950">
                {gym.name}
              </h2>
            ) : (
              <Link
                href={`/gym/${gym.id}`}
                className="mt-1 block truncate text-xl font-black tracking-[-0.025em] text-zinc-950 hover:text-orange-700"
              >
                {gym.name}
              </Link>
            )}
          </div>

          {isEventVariant && showFollow && !preview && (
            <InterestHeart
              kind="gym"
              targetId={gym.id}
              initialInterested={isFollowed}
              userId={userId}
              loginRedirect={loginRedirect}
              size="xs"
            />
          )}
        </div>

        {!isEventVariant && locationLine && (
          <div className="mt-3">
            {gym.address?.trim() ? (
              <GymAddressCopy address={gym.address} />
            ) : (
              <p className="text-sm text-zinc-600">{gym.region}</p>
            )}
          </div>
        )}

        {!isEventVariant && (gym.address?.trim() || locationLine) && (
          preview ? (
            <div className="mt-4 flex w-full items-center justify-center gap-2 border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-500">
              <AppIcon name="map-pin" className="size-4" />
              지도 보기
            </div>
          ) : (
            <a
              href={getMapSearchUrl(gym.address?.trim() || locationLine)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 border border-zinc-300 py-2.5 text-sm font-semibold text-zinc-800 hover:border-zinc-500"
            >
              <AppIcon name="map-pin" className="size-4" />
              지도 보기
            </a>
          )
        )}

        {isEventVariant && (
          <GymContactLinks
            phone={gym.phone}
            instagramUrl={gym.instagram_url}
            instagramHandle={instagramHandle}
            showPhone={false}
          />
        )}

        {isEventVariant && (
          <>
            <GymOtherEventsList events={otherUpcomingEvents} />
            <Link
              href={`/gym/${gym.id}`}
              className="mt-5 flex items-center justify-between border-y border-zinc-300 py-3 text-sm font-bold text-zinc-900 hover:text-orange-700"
            >
              <span>체육관 프로필 보기</span>
              <span>→</span>
            </Link>
          </>
        )}

        {!isEventVariant && (
          <>
            {hasMore && !preview && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-5 flex w-full items-center justify-between border-y border-zinc-300 py-3 text-sm font-bold text-zinc-900 hover:text-orange-700"
              >
                <span>{expanded ? "상세정보 접기" : "상세정보 보기"}</span>
                <span>{expanded ? "−" : "+"}</span>
              </button>
            )}

            {(expanded || preview) && hasMore && (
              <div className="mt-5 space-y-5">
                {(gym.operating_hours?.trim() ||
                  gym.closed_days?.trim() ||
                  schedule.length > 0) && (
                  <SectionBlock title="SCHEDULE">
                    {schedule.length > 0 && (
                      <ul className="space-y-4">
                        {schedule.map((slot, index) => (
                          <li key={slot.key}>
                            {index > 0 && (
                              <hr className="mb-4 border-zinc-200" aria-hidden />
                            )}
                            <p className="text-sm font-bold text-zinc-900">
                              {formatDaysLabel(slot.days)}
                            </p>
                            {slot.className && (
                              <p className="mt-1 text-sm text-zinc-700">
                                {slot.className}
                              </p>
                            )}
                            <p className="mt-0.5 text-sm text-zinc-500">
                              {slot.start} — {slot.end}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {gym.closed_days?.trim() && (
                      <p className={`text-sm text-zinc-700 ${schedule.length > 0 ? "mt-4 border-t border-zinc-200 pt-4" : ""}`}>
                        휴무 · {gym.closed_days.trim()}
                      </p>
                    )}

                    {gym.operating_hours?.trim() && (
                      <p className={`text-sm text-zinc-700 ${schedule.length > 0 || gym.closed_days?.trim() ? "mt-3" : ""}`}>
                        운영시간 · {gym.operating_hours.trim()}
                      </p>
                    )}
                  </SectionBlock>
                )}

                {hasFacilityDetails && (
                  <SectionBlock title="FACILITIES">
                    {facilities.length > 0 && (
                      <p className="text-sm leading-7 text-zinc-700">
                        {facilities.join(" · ")}
                      </p>
                    )}
                    {gym.facility_notes?.trim() && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                        {gym.facility_notes.trim()}
                      </p>
                    )}
                  </SectionBlock>
                )}

                {gym.homepage_url && (
                  <SectionBlock title="WEBSITE">
                    {preview ? (
                      <p className="text-sm text-zinc-700">{gym.homepage_url}</p>
                    ) : (
                      <a
                        href={gym.homepage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-orange-600 hover:underline"
                      >
                        {gym.homepage_url}
                      </a>
                    )}
                  </SectionBlock>
                )}
              </div>
            )}

            {hasContact && (
              <div className="mt-5 border-t border-zinc-300 pt-5">
                <p className="mb-3 text-[10px] font-black tracking-[0.14em] text-zinc-400">
                  CONTACT
                </p>
                <GymContactLinks
                  phone={gym.phone}
                  instagramUrl={gym.instagram_url}
                  instagramHandle={instagramHandle}
                />
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

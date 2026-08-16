"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { Gym } from "@/lib/types/database";
import { getFacilityIcon } from "@/lib/constants/gym";
import { getSportEmoji } from "@/lib/constants/profile";
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
  /** event: 이벤트 상세용 간소화 · gym: 체육관 상세용 전체 */
  variant?: "event" | "gym";
  defaultExpanded?: boolean;
  /** 등록 폼 미리보기 — 링크·팔로우 비활성, 상세정보 펼침 */
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
    <div>
      <p className="text-xs font-medium text-zinc-500">{title}</p>
      <div className="mt-2">{children}</div>
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
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {!isEventVariant && showFollow && !preview && (
        <div className="flex justify-end px-3 pt-3">
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

      <div className="relative">
        <GymPhotoCarousel
          photos={displayPhotos}
          alt={gym.name}
          aspect="portrait"
          showPhotoLabels
          dotPosition="raised"
        />
      </div>

      <div className="p-5">
        <h2 className="font-semibold text-zinc-900">체육관 정보</h2>

        <div className="mt-4">
          <div className="flex min-w-0 items-center">
            {isEventVariant ? (
              <p className="min-w-0 truncate font-semibold text-zinc-900">
                {gym.name}
              </p>
            ) : preview ? (
              <p className="min-w-0 truncate font-semibold text-zinc-900">
                {gym.name}
              </p>
            ) : (
              <Link
                href={`/gym/${gym.id}`}
                className="min-w-0 truncate font-semibold text-zinc-900 hover:text-orange-700"
              >
                {gym.name}
              </Link>
            )}
            {isEventVariant && showFollow && !preview && (
              <InterestHeart
                kind="gym"
                targetId={gym.id}
                initialInterested={isFollowed}
                userId={userId}
                loginRedirect={loginRedirect}
                size="xs"
                className="-ml-1.5"
              />
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            {getSportEmoji(gym.sport ?? "유도")} {gym.sport ?? "유도"}
          </p>
          {!isEventVariant &&
            locationLine &&
            (gym.address?.trim() ? (
              <GymAddressCopy address={gym.address} />
            ) : (
              <p className="mt-2 text-sm text-zinc-700">📍 {gym.region}</p>
            ))}
        </div>

        {!isEventVariant && (gym.address?.trim() || locationLine) && (
          preview ? (
            <div className="mt-4 flex w-full items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-medium text-zinc-500">
              📍 지도 보기
            </div>
          ) : (
            <a
              href={getMapSearchUrl(gym.address?.trim() || locationLine)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex w-full items-center justify-center rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              📍 지도 보기
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
              className="mt-5 block rounded-lg bg-orange-600 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
            >
              체육관 보기
            </Link>
          </>
        )}

        {!isEventVariant && (
          <>
            {hasMore && !preview && (
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="mt-4 w-full rounded-lg py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
              >
                {expanded ? "접기" : "상세정보"}
              </button>
            )}

            {(expanded || preview) && hasMore && (
              <div className="mt-4 space-y-5 border-t border-zinc-100 pt-4">
                {(gym.operating_hours?.trim() ||
                  gym.closed_days?.trim() ||
                  schedule.length > 0) && (
                  <SectionBlock title="운영 정보">
                    {schedule.length > 0 && (
                      <ul className="space-y-4">
                        {schedule.map((slot, index) => (
                          <li key={slot.key}>
                            {index > 0 && (
                              <hr
                                className="mb-4 border-zinc-100"
                                aria-hidden
                              />
                            )}
                            <p className="text-sm font-medium text-zinc-900">
                              {formatDaysLabel(slot.days)}
                            </p>
                            {slot.className && (
                              <p className="mt-1 text-sm text-zinc-700">
                                {getSportEmoji(gym.sport ?? "유도")}{" "}
                                {slot.className}
                              </p>
                            )}
                            <p className="mt-0.5 text-sm text-zinc-600">
                              {slot.start} ~ {slot.end}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}

                    {gym.closed_days?.trim() && (
                      <p
                        className={`text-sm text-zinc-700 ${schedule.length > 0 ? "mt-4 border-t border-zinc-100 pt-4" : ""}`}
                      >
                        휴무 · {gym.closed_days.trim()}
                      </p>
                    )}

                    {gym.operating_hours?.trim() && (
                      <p
                        className={`text-sm text-zinc-700 ${
                          schedule.length > 0 || gym.closed_days?.trim()
                            ? "mt-3"
                            : ""
                        }`}
                      >
                        🕐 {gym.operating_hours.trim()}
                      </p>
                    )}
                  </SectionBlock>
                )}

                {hasFacilityDetails && (
                  <SectionBlock title="시설 정보">
                    {facilities.length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {facilities.map((label) => (
                          <li
                            key={label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800"
                          >
                            <span className="leading-none" aria-hidden>
                              {getFacilityIcon(label)}
                            </span>
                            {label}
                          </li>
                        ))}
                      </ul>
                    )}
                    {gym.facility_notes?.trim() && (
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                        {gym.facility_notes.trim()}
                      </p>
                    )}
                  </SectionBlock>
                )}

                {gym.homepage_url && (
                  <SectionBlock title="홈페이지">
                    {preview ? (
                      <p className="text-sm text-zinc-700">{gym.homepage_url}</p>
                    ) : (
                      <a
                        href={gym.homepage_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:underline"
                      >
                        {gym.homepage_url}
                      </a>
                    )}
                  </SectionBlock>
                )}
              </div>
            )}

            {hasContact && (
              <div className="mt-5 border-t border-zinc-100 pt-5">
                <p className="mb-3 text-xs font-medium text-zinc-500">문의</p>
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

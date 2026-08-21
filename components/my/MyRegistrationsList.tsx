"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MyRegistrationCard } from "@/components/my/MyRegistrationCard";
import { EmptyState } from "@/components/EmptyState";
import { getTodayDateString } from "@/lib/utils/date";
import type { RegistrationStatus } from "@/lib/types/database";

export type MyRegistrationItem = {
  id: string;
  eventId: string;
  status: RegistrationStatus;
  cancelledByEvent: boolean;
  title: string;
  eventDate: string;
  eventTime: string | null;
  eventType?: string;
  sport: string;
  region: string;
};

type MyRegistrationsListProps = {
  registrations: MyRegistrationItem[];
  initialSelectedDate?: string;
};

type ScheduleView = "calendar" | "list";
type ListTab = "upcoming" | "past";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;

function parseDateKey(dateKey: string): Date | null {
  const [year, month, day] = dateKey.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toMonthStart(dateKey: string): Date {
  const parsed = parseDateKey(dateKey) ?? new Date();
  return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

function toDateKey(year: number, monthIndex: number, day: number): string {
  const month = String(monthIndex + 1).padStart(2, "0");
  const date = String(day).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function isActiveUpcoming(registration: MyRegistrationItem, today: string): boolean {
  return (
    registration.eventDate >= today &&
    (registration.status === "pending" || registration.status === "approved")
  );
}

function getStatusDotClass(registration: MyRegistrationItem, today: string): string {
  if (registration.eventDate < today) return "bg-zinc-400";
  if (registration.status === "approved") return "bg-green-500";
  if (registration.status === "pending") return "bg-amber-400";
  return "bg-red-500";
}

function formatSelectedDate(dateKey: string): string {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
}

function formatMonthGroup(dateKey: string): string {
  const parsed = parseDateKey(dateKey);
  if (!parsed) return dateKey;
  const currentYear = new Date().getFullYear();
  return parsed.getFullYear() === currentYear
    ? `${parsed.getMonth() + 1}월`
    : `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월`;
}

export function MyRegistrationsList({
  registrations,
  initialSelectedDate,
}: MyRegistrationsListProps) {
  const today = getTodayDateString();

  const upcoming = useMemo(
    () =>
      registrations
        .filter((registration) => isActiveUpcoming(registration, today))
        .sort((a, b) =>
          `${a.eventDate}-${a.eventTime ?? ""}`.localeCompare(
            `${b.eventDate}-${b.eventTime ?? ""}`,
          ),
        ),
    [registrations, today],
  );

  const past = useMemo(
    () =>
      registrations
        .filter((registration) => !isActiveUpcoming(registration, today))
        .sort((a, b) =>
          `${b.eventDate}-${b.eventTime ?? ""}`.localeCompare(
            `${a.eventDate}-${a.eventTime ?? ""}`,
          ),
        ),
    [registrations, today],
  );

  const firstScheduleDate =
    initialSelectedDate || upcoming[0]?.eventDate || registrations[0]?.eventDate || today;

  const [view, setView] = useState<ScheduleView>("calendar");
  const [listTab, setListTab] = useState<ListTab>("upcoming");
  const [monthCursor, setMonthCursor] = useState<Date>(() =>
    toMonthStart(firstScheduleDate),
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    initialSelectedDate || upcoming[0]?.eventDate || null,
  );

  const registrationsByDate = useMemo(() => {
    const map = new Map<string, MyRegistrationItem[]>();
    for (const registration of registrations) {
      const current = map.get(registration.eventDate) ?? [];
      current.push(registration);
      map.set(registration.eventDate, current);
    }
    return map;
  }, [registrations]);

  const year = monthCursor.getFullYear();
  const monthIndex = monthCursor.getMonth();
  const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const calendarCells = Array.from({ length: calendarCellCount }, (_, index) => {
    const day = index - firstWeekday + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const selectedRegistrations = selectedDate
    ? registrationsByDate.get(selectedDate) ?? []
    : [];

  const visibleList = listTab === "upcoming" ? upcoming : past;
  const groupedList = useMemo(() => {
    const groups: Array<{ key: string; label: string; items: MyRegistrationItem[] }> = [];
    for (const registration of visibleList) {
      const key = registration.eventDate.slice(0, 7);
      const last = groups.at(-1);
      if (last?.key === key) {
        last.items.push(registration);
      } else {
        groups.push({
          key,
          label: formatMonthGroup(registration.eventDate),
          items: [registration],
        });
      }
    }
    return groups;
  }, [visibleList]);

  function moveMonth(offset: number) {
    const nextMonth = new Date(year, monthIndex + offset, 1);
    setMonthCursor(nextMonth);

    const nextKey = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1,
    ).padStart(2, "0")}`;
    const firstInMonth = registrations.find((registration) =>
      registration.eventDate.startsWith(nextKey),
    );
    setSelectedDate(firstInMonth?.eventDate ?? null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1">
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`rounded-lg py-2.5 text-sm font-medium transition ${
            view === "calendar"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          📅 캘린더
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg py-2.5 text-sm font-medium transition ${
            view === "list"
              ? "bg-white text-zinc-900 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          📋 목록
        </button>
      </div>

      {view === "calendar" ? (
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label="이전 달"
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-600 hover:bg-zinc-100"
              >
                ‹
              </button>
              <h2 className="text-base font-semibold text-zinc-900">
                {year}년 {monthIndex + 1}월
              </h2>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label="다음 달"
                className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-600 hover:bg-zinc-100"
              >
                ›
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 text-center text-xs font-medium text-zinc-400">
              {WEEKDAY_LABELS.map((weekday) => (
                <div key={weekday} className="py-1">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-y-1">
              {calendarCells.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="h-14" />;
                }

                const dateKey = toDateKey(year, monthIndex, day);
                const dayItems = registrationsByDate.get(dateKey) ?? [];
                const isSelected = selectedDate === dateKey;
                const isToday = dateKey === today;

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(dateKey)}
                    className={`flex h-14 flex-col items-center justify-center rounded-xl text-sm transition ${
                      isSelected
                        ? "bg-orange-50 font-semibold text-orange-700 ring-1 ring-orange-300"
                        : isToday
                          ? "bg-zinc-100 font-semibold text-zinc-900"
                          : "text-zinc-700 hover:bg-zinc-50"
                    }`}
                  >
                    <span>{day}</span>
                    <span className="mt-1 flex h-2 items-center justify-center gap-0.5">
                      {dayItems.slice(0, 3).map((registration) => (
                        <span
                          key={registration.id}
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                            registration,
                            today,
                          )}`}
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-zinc-100 pt-3 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" /> 승인 대기
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-500" /> 참가 확정
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" /> 취소·거절
              </span>
            </div>
          </section>

          {selectedDate && selectedRegistrations.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                {formatSelectedDate(selectedDate)} 일정
              </h3>
              <ul className="flex flex-col gap-3">
                {selectedRegistrations.map((registration) => (
                  <MyRegistrationCard
                    key={registration.id}
                    registrationId={registration.id}
                    eventId={registration.eventId}
                    status={registration.status}
                    cancelledByEvent={registration.cancelledByEvent}
                    title={registration.title}
                    eventDate={registration.eventDate}
                    eventTime={registration.eventTime}
                    eventType={registration.eventType}
                    sport={registration.sport}
                    region={registration.region}
                    emphasizeToday={registration.eventDate === today}
                  />
                ))}
              </ul>
            </section>
          ) : (
            <div className="flex flex-col gap-3">
              <EmptyState
                message={
                  registrations.some((registration) =>
                    registration.eventDate.startsWith(monthKey),
                  )
                    ? "날짜를 선택하면 해당 일정이 표시됩니다."
                    : "이 달에는 참가 일정이 없습니다."
                }
              />
              <Link
                href="/events"
                className="text-center text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                이벤트 찾기 →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex rounded-xl bg-zinc-100 p-1">
            <button
              type="button"
              onClick={() => setListTab("upcoming")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                listTab === "upcoming"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              예정 ({upcoming.length})
            </button>
            <button
              type="button"
              onClick={() => setListTab("past")}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                listTab === "past"
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              지난·취소 ({past.length})
            </button>
          </div>

          {visibleList.length === 0 ? (
            <div className="flex flex-col gap-3">
              <EmptyState
                message={
                  listTab === "upcoming"
                    ? "예정된 참가 일정이 없습니다."
                    : "지난 일정이나 취소된 신청이 없습니다."
                }
              />
              {listTab === "upcoming" && (
                <Link
                  href="/events"
                  className="text-center text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                  이벤트 찾기 →
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {groupedList.map((group) => (
                <section key={group.key} className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold text-zinc-700">{group.label}</h3>
                  <ul className="flex flex-col gap-3">
                    {group.items.map((registration) => (
                      <MyRegistrationCard
                        key={registration.id}
                        registrationId={registration.id}
                        eventId={registration.eventId}
                        status={registration.status}
                        cancelledByEvent={registration.cancelledByEvent}
                        title={registration.title}
                        eventDate={registration.eventDate}
                        eventTime={registration.eventTime}
                        eventType={registration.eventType}
                        sport={registration.sport}
                        region={registration.region}
                        emphasizeToday={registration.eventDate === today}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

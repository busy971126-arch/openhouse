"use client";

import { useState } from "react";
import { SignupField, SignupInput } from "@/components/SignupField";
import { CLASS_SCHEDULE_DAYS } from "@/lib/constants/class-schedule";
import {
  addDraftToSchedule,
  createEmptyDraft,
  draftFromGroup,
  expandDraftToEntries,
  groupClassSchedule,
  removeScheduleEntries,
  replaceScheduleGroup,
  validateDraft,
  type ClassScheduleDraft,
  type ClassScheduleEntry,
  type ClassScheduleGroup,
} from "@/lib/utils/class-schedule";

type ClassScheduleInputProps = {
  value: ClassScheduleEntry[];
  onChange: (value: ClassScheduleEntry[]) => void;
};

function TimeRow({
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SignupField label="시작 시간">
        <input
          type="time"
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </SignupField>
      <SignupField label="종료 시간">
        <input
          type="time"
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-full rounded-lg border border-zinc-400 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
        />
      </SignupField>
    </div>
  );
}

function ScheduleDraftForm({
  draft,
  onDraftChange,
  onSubmit,
  submitLabel,
  onCancel,
}: {
  draft: ClassScheduleDraft;
  onDraftChange: (draft: ClassScheduleDraft) => void;
  onSubmit: () => void;
  submitLabel: string;
  onCancel?: () => void;
}) {
  function toggleDay(day: (typeof CLASS_SCHEDULE_DAYS)[number]) {
    const days = draft.days.includes(day)
      ? draft.days.filter((item) => item !== day)
      : [...draft.days, day];
    onDraftChange({ ...draft, days });
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-zinc-900">요일 선택</legend>
        <div className="flex flex-wrap gap-2">
          {CLASS_SCHEDULE_DAYS.map((day) => {
            const selected = draft.days.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  selected
                    ? "bg-orange-600 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:border-orange-300"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </fieldset>

      <SignupField label="수업명" hint="선택">
        <SignupInput
          value={draft.className}
          onChange={(e) => onDraftChange({ ...draft, className: e.target.value })}
          placeholder="예: 일반부"
        />
      </SignupField>

      <TimeRow
        start={draft.start}
        end={draft.end}
        onStartChange={(start) => onDraftChange({ ...draft, start })}
        onEndChange={(end) => onDraftChange({ ...draft, end })}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          className="flex-1 rounded-lg bg-orange-600 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
}

function ScheduleGroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: ClassScheduleGroup;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const dayLabel =
    group.days.length === 1 && group.days[0] === "토"
      ? "토요일"
      : group.days.length === 1 && group.days[0] === "일"
        ? "일요일"
        : group.days.join(" · ");

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{dayLabel}</p>
          {group.className && (
            <p className="mt-1 text-sm text-zinc-700">{group.className}</p>
          )}
          <p className="mt-1 text-sm text-zinc-600">
            {group.start} ~ {group.end}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-medium text-zinc-500 hover:text-red-600"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClassScheduleInput({ value, onChange }: ClassScheduleInputProps) {
  const [draft, setDraft] = useState<ClassScheduleDraft>(createEmptyDraft());
  const [draftError, setDraftError] = useState<string | null>(null);
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);

  const groups = groupClassSchedule(value);

  function resetDraft() {
    setDraft(createEmptyDraft());
    setDraftError(null);
    setEditingGroupKey(null);
  }

  function handleAdd() {
    const error = validateDraft(draft);
    if (error) {
      setDraftError(error);
      return;
    }

    onChange(addDraftToSchedule(value, draft));
    resetDraft();
  }

  function handleUpdate() {
    const error = validateDraft(draft);
    if (error) {
      setDraftError(error);
      return;
    }

    const group = groups.find((item) => item.key === editingGroupKey);
    if (!group) return;

    onChange(replaceScheduleGroup(value, group.entryIds, draft));
    resetDraft();
  }

  function handleEdit(group: ClassScheduleGroup) {
    setEditingGroupKey(group.key);
    setDraft(draftFromGroup(group));
    setDraftError(null);
  }

  function handleDelete(group: ClassScheduleGroup) {
    onChange(removeScheduleEntries(value, group.entryIds));
    if (editingGroupKey === group.key) resetDraft();
  }

  const previewEntries = validateDraft(draft) ? [] : expandDraftToEntries(draft);

  return (
    <div className="flex flex-col gap-4">
      <ScheduleDraftForm
        draft={draft}
        onDraftChange={(next) => {
          setDraft(next);
          setDraftError(null);
        }}
        onSubmit={editingGroupKey ? handleUpdate : handleAdd}
        submitLabel={editingGroupKey ? "시간표 수정" : "+ 시간 추가"}
        onCancel={editingGroupKey ? resetDraft : undefined}
      />

      {draftError && <p className="text-sm text-red-600">{draftError}</p>}

      {!editingGroupKey && previewEntries.length > 0 && (
        <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/50 p-3">
          <p className="mb-2 text-xs font-medium text-orange-800">
            추가 시 자동 생성 ({previewEntries.length}개)
          </p>
          <ul className="flex flex-col gap-1 text-xs text-orange-900">
            {previewEntries.map((entry) => (
              <li key={entry.id}>
                {entry.day}
                {entry.className ? ` · ${entry.className}` : ""} · {entry.start} ~{" "}
                {entry.end}
              </li>
            ))}
          </ul>
        </div>
      )}

      {groups.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-zinc-900">추가된 시간표</p>
          {groups.map((group) => (
            <ScheduleGroupCard
              key={group.key}
              group={group}
              onEdit={() => handleEdit(group)}
              onDelete={() => handleDelete(group)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

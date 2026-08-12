"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  GYM_OPTIONAL_PHOTO_CATEGORIES,
  GYM_REPRESENTATIVE_PHOTO,
  formatPhotoCategoryStatus,
  type GymOptionalPhotoCategory,
} from "@/lib/constants/gym-photos";
import {
  countOptionalPhotos,
  type OptionalCategoryPhotoState,
} from "@/lib/utils/gym-photo-items";

export type OptionalCategoryPhotos = Record<
  GymOptionalPhotoCategory,
  OptionalCategoryPhotoState
>;

type GymPhotoCategoriesInputProps = {
  representativePreview: string | null;
  hasRepresentative: boolean;
  onRepresentativeSelect: (file: File) => void;
  optional: OptionalCategoryPhotos;
  onOptionalAdd: (category: GymOptionalPhotoCategory, files: File[]) => void;
  onOptionalRemoveItem: (
    category: GymOptionalPhotoCategory,
    index: number,
  ) => void;
  onOptionalRemovePending: (
    category: GymOptionalPhotoCategory,
    index: number,
  ) => void;
  onOptionalCaptionChange: (
    category: GymOptionalPhotoCategory,
    index: number,
    kind: "saved" | "pending",
    caption: string,
  ) => void;
};

const EXTRA_CATEGORIES = GYM_OPTIONAL_PHOTO_CATEGORIES.filter(
  (category) => category.id !== "mat",
);

function PhotoCaptionInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400"
    />
  );
}

function PhotoThumbGrid({
  items,
  pendingPreviews,
  pendingCaptions,
  captionPlaceholder,
  onRemoveItem,
  onRemovePending,
  onCaptionChange,
}: {
  items: OptionalCategoryPhotoState["items"];
  pendingPreviews: string[];
  pendingCaptions: string[];
  captionPlaceholder: string;
  onRemoveItem: (index: number) => void;
  onRemovePending: (index: number) => void;
  onCaptionChange: (
    index: number,
    kind: "saved" | "pending",
    caption: string,
  ) => void;
}) {
  if (items.length === 0 && pendingPreviews.length === 0) return null;

  return (
    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      {items.map((item, index) => (
        <div key={`${item.url}-${index}`}>
          <div className="relative">
            <img
              src={item.url}
              alt=""
              className="aspect-[4/3] w-full rounded-lg border border-zinc-200 object-cover"
            />
            <button
              type="button"
              onClick={() => onRemoveItem(index)}
              className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
            >
              삭제
            </button>
          </div>
          <PhotoCaptionInput
            value={item.caption}
            placeholder={captionPlaceholder}
            onChange={(caption) => onCaptionChange(index, "saved", caption)}
          />
        </div>
      ))}

      {pendingPreviews.map((preview, index) => (
        <div key={`pending-${preview}`}>
          <div className="relative">
            <img
              src={preview}
              alt=""
              className="aspect-[4/3] w-full rounded-lg border border-orange-200 object-cover"
            />
            <span className="absolute left-2 top-2 rounded bg-orange-600 px-1.5 py-0.5 text-xs text-white">
              새 사진
            </span>
            <button
              type="button"
              onClick={() => onRemovePending(index)}
              className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white"
            >
              삭제
            </button>
          </div>
          <PhotoCaptionInput
            value={pendingCaptions[index] ?? ""}
            placeholder={captionPlaceholder}
            onChange={(caption) => onCaptionChange(index, "pending", caption)}
          />
        </div>
      ))}
    </div>
  );
}

function CategoryBlock({
  order,
  title,
  required,
  hint,
  status,
  children,
}: {
  order: number;
  title: string;
  required?: boolean;
  hint: string;
  status: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-zinc-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-zinc-900">
          {order}. {title}
          {required && (
            <span className="ml-1 text-red-600" aria-hidden>
              *
            </span>
          )}
        </p>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
          {status}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-zinc-500">
        {hint}
      </p>
      {children}
    </div>
  );
}

function OptionalCategorySection({
  category,
  photos,
  onOptionalAdd,
  onOptionalRemoveItem,
  onOptionalRemovePending,
  onOptionalCaptionChange,
}: {
  category: (typeof GYM_OPTIONAL_PHOTO_CATEGORIES)[number];
  photos: OptionalCategoryPhotoState;
  onOptionalAdd: (category: GymOptionalPhotoCategory, files: File[]) => void;
  onOptionalRemoveItem: (
    category: GymOptionalPhotoCategory,
    index: number,
  ) => void;
  onOptionalRemovePending: (
    category: GymOptionalPhotoCategory,
    index: number,
  ) => void;
  onOptionalCaptionChange: (
    category: GymOptionalPhotoCategory,
    index: number,
    kind: "saved" | "pending",
    caption: string,
  ) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const count = countOptionalPhotos(photos);
  const captionPlaceholder =
    category.captionPlaceholder ?? "시설명을 입력해 주세요";

  return (
    <CategoryBlock
      order={category.order}
      title={category.title}
      hint={category.hint}
      status={formatPhotoCategoryStatus(count)}
    >
      <PhotoThumbGrid
        items={photos.items}
        pendingPreviews={photos.pendingPreviews}
        pendingCaptions={photos.pendingCaptions}
        captionPlaceholder={captionPlaceholder}
        onRemoveItem={(index) => onOptionalRemoveItem(category.id, index)}
        onRemovePending={(index) =>
          onOptionalRemovePending(category.id, index)
        }
        onCaptionChange={(index, kind, caption) =>
          onOptionalCaptionChange(category.id, index, kind, caption)
        }
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).filter((file) =>
            file.type.startsWith("image/"),
          );
          if (files.length > 0) onOptionalAdd(category.id, files);
          e.target.value = "";
        }}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-3 w-full rounded-lg border border-zinc-300 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
      >
        사진 추가
      </button>
    </CategoryBlock>
  );
}

export function GymPhotoCategoriesInput({
  representativePreview,
  hasRepresentative,
  onRepresentativeSelect,
  optional,
  onOptionalAdd,
  onOptionalRemoveItem,
  onOptionalRemovePending,
  onOptionalCaptionChange,
}: GymPhotoCategoriesInputProps) {
  const representativeInputRef = useRef<HTMLInputElement>(null);
  const matCategory = GYM_OPTIONAL_PHOTO_CATEGORIES.find(
    (category) => category.id === "mat",
  )!;
  const extraPhotoCount = EXTRA_CATEGORIES.reduce(
    (sum, category) => sum + countOptionalPhotos(optional[category.id]),
    0,
  );
  const [showExtraPhotos, setShowExtraPhotos] = useState(extraPhotoCount > 0);

  function handleRepresentativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file?.type.startsWith("image/")) {
      onRepresentativeSelect(file);
    }
    e.target.value = "";
  }

  const representativeCount = hasRepresentative ? 1 : 0;

  return (
    <div className="flex flex-col gap-4">
      <CategoryBlock
        order={GYM_REPRESENTATIVE_PHOTO.order}
        title={GYM_REPRESENTATIVE_PHOTO.title}
        required
        hint={GYM_REPRESENTATIVE_PHOTO.hint}
        status={formatPhotoCategoryStatus(representativeCount, true)}
      >
        {representativePreview ? (
          <img
            src={representativePreview}
            alt="대표 단체사진"
            className="mt-3 aspect-[16/10] w-full rounded-lg border border-zinc-200 object-cover"
          />
        ) : (
          <div className="mt-3 flex aspect-[16/10] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm text-zinc-500">
            대표 단체사진을 등록해주세요
          </div>
        )}
        <input
          ref={representativeInputRef}
          type="file"
          accept="image/*"
          onChange={handleRepresentativeChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => representativeInputRef.current?.click()}
          className="mt-3 w-full rounded-lg border border-zinc-300 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          {representativePreview ? "사진 변경" : "사진 선택"}
        </button>
      </CategoryBlock>

      <OptionalCategorySection
        category={matCategory}
        photos={optional.mat}
        onOptionalAdd={onOptionalAdd}
        onOptionalRemoveItem={onOptionalRemoveItem}
        onOptionalRemovePending={onOptionalRemovePending}
        onOptionalCaptionChange={onOptionalCaptionChange}
      />

      <div className="border-t border-zinc-100 pt-4">
        <button
          type="button"
          onClick={() => setShowExtraPhotos((current) => !current)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-zinc-200 px-3 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          <span>
            외관 · 주차 사진
            <span className="ml-2 font-normal text-zinc-500">선택</span>
          </span>
          <span className="text-xs text-zinc-500">
            {showExtraPhotos ? "접기" : "펼치기"}
            {extraPhotoCount > 0 ? ` · ${extraPhotoCount}장` : ""}
          </span>
        </button>

        {showExtraPhotos && (
          <div className="mt-4 flex flex-col gap-4">
            {EXTRA_CATEGORIES.map((category) => (
              <OptionalCategorySection
                key={category.id}
                category={category}
                photos={optional[category.id]}
                onOptionalAdd={onOptionalAdd}
                onOptionalRemoveItem={onOptionalRemoveItem}
                onOptionalRemovePending={onOptionalRemovePending}
                onOptionalCaptionChange={onOptionalCaptionChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { EventGymSection } from "@/components/events/EventGymSection";
import { GymProfilePreview } from "@/components/gym/GymProfilePreview";
import {
  buildGymPreviewFromForm,
  type GymFormPreviewInput,
} from "@/lib/utils/gym-form-preview";

type GymFormPreviewPanelProps = GymFormPreviewInput;

type PreviewTab = "detail" | "discovery";

export function GymFormPreviewPanel(props: GymFormPreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<PreviewTab>("detail");
  const previewGym = buildGymPreviewFromForm(props);

  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">프로필 미리보기</h2>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">
            예정 참가자에게 보이는 화면입니다. 저장 전에 확인하세요.
          </p>
        </div>

        <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
          <TabButton
            active={activeTab === "discovery"}
            onClick={() => setActiveTab("discovery")}
          >
            탐색 카드
          </TabButton>
          <TabButton
            active={activeTab === "detail"}
            onClick={() => setActiveTab("detail")}
          >
            상세 프로필
          </TabButton>
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "discovery" ? (
          <GymProfilePreview
            embedded
            name={props.name}
            sport={props.sport}
            address={props.address}
            representativePreview={props.representativePreview}
            optional={props.optionalPhotos}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100/80">
            <EventGymSection
              gym={previewGym}
              userId={null}
              isFollowed={false}
              loginRedirect="/gym/preview"
              showFollow={false}
              variant="gym"
              preview
            />
          </div>
        )}
      </div>
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-orange-600 text-white"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      {children}
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { ParticipantPartySummary } from "@/components/participants/ParticipantPartyBadge";
import {
  formatHostParticipantSubline,
  getHostParticipantDisplayName,
  HOST_STATUS_BADGE_CLASS,
  HOST_STATUS_LABELS,
} from "@/lib/utils/host-participant-status";
import type { ParticipantItem } from "@/lib/utils/participant-items";
import type { RegistrationStatus } from "@/lib/types/database";

type HostParticipantRowProps = {
  eventId: string;
  participant: ParticipantItem;
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  partyCompanionLabels?: string[];
};

export function HostParticipantRow({
  eventId,
  participant,
  selected,
  onSelectedChange,
  partyCompanionLabels = [],
}: HostParticipantRowProps) {
  const router = useRouter();
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<RegistrationStatus>(participant.status);
  const detailHref = `/host/participants/${eventId}/${participant.id}`;

  useEffect(() => {
    setStatus(participant.status);
  }, [participant.status]);

  async function updateStatus(newStatus: RegistrationStatus) {
    setLoading(true);
    setMenuOpen(false);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.rpc("update_registration_status", {
      p_registration_id: participant.id,
      p_status: newStatus,
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setStatus(newStatus);
    router.refresh();
  }

  const displayName = getHostParticipantDisplayName(participant);
  const subline = formatHostParticipantSubline(participant);

  return (
    <li className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
      <div className="flex items-start gap-3">
        <label
          className="mt-1 flex shrink-0 cursor-pointer items-center"
          onClick={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={(event) => onSelectedChange(event.target.checked)}
            className="size-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
            aria-label={`${displayName} 선택`}
          />
        </label>

        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Link
            href={detailHref}
            className="min-w-0 flex-1 rounded-lg transition hover:bg-zinc-50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {displayName}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${HOST_STATUS_BADGE_CLASS[status]}`}
              >
                {HOST_STATUS_LABELS[status]}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-zinc-500">{subline}</p>
            <ParticipantPartySummary
              partyId={participant.partyId}
              partyRepresentativeUserId={participant.partyRepresentativeUserId}
              userId={participant.userId}
              companionLabels={partyCompanionLabels}
            />
          </Link>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              disabled={loading}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMenuOpen((open) => !open);
              }}
              className="rounded-lg px-2 py-1 text-lg leading-none text-zinc-500 hover:bg-zinc-100 disabled:opacity-50"
            >
              ⋯
            </button>

            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-label="메뉴 닫기"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  id={menuId}
                  role="menu"
                  className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
                >
                  {status === "pending" && (
                    <>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => updateStatus("approved")}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                      >
                        참가 확정
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          if (confirm("참가 신청을 거절하시겠습니까?")) {
                            updateStatus("rejected");
                          }
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
                      >
                        거절
                      </button>
                    </>
                  )}
                  <Link
                    href={detailHref}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
                  >
                    상세보기
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2">
          <Alert message={error} />
        </div>
      )}
    </li>
  );
}

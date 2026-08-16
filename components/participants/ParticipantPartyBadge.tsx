import type { ParticipantItem } from "@/lib/utils/participant-items";
import {
  formatPartyCompanionLabel,
  type ParticipantPartyGroup,
} from "@/lib/utils/participant-party";

type ParticipantPartyBadgeProps = {
  group: ParticipantPartyGroup;
};

export function ParticipantPartyBadge({ group }: ParticipantPartyBadgeProps) {
  if (group.companions.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2">
      <p className="text-xs font-medium text-orange-800">
        동행 신청 · 대표 {formatPartyCompanionLabel(group.leader)}
      </p>
      <p className="mt-1 text-xs text-orange-700">
        함께 신청 {group.companions.length + 1}명 · 동행{" "}
        {group.companions
          .map((companion) => formatPartyCompanionLabel(companion))
          .join(", ")}
      </p>
    </div>
  );
}

type ParticipantPartySummaryProps = {
  partyId: string | null;
  partyRepresentativeUserId: string | null;
  userId: string | null;
  companionLabels?: string[];
};

export function ParticipantPartySummary({
  partyId,
  partyRepresentativeUserId,
  userId,
  companionLabels = [],
}: ParticipantPartySummaryProps) {
  if (!partyId) return null;

  const isLeader = userId != null && partyRepresentativeUserId === userId;

  return (
    <p className="mt-1 text-xs text-orange-700">
      {isLeader
        ? companionLabels.length > 0
          ? `동행 신청 · ${companionLabels.join(", ")}와 함께 신청`
          : "동행 신청 · 대표 신청자"
        : "동행 멤버로 포함된 신청"}
    </p>
  );
}

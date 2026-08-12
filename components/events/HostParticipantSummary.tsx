import type { RegistrationStatus } from "@/lib/types/database";

type HostParticipantSummaryProps = {
  total: number;
  pending: number;
  approved: number;
  sparring: number;
  maxParticipants: number | null;
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export function HostParticipantSummary({
  total,
  pending,
  approved,
  sparring,
  maxParticipants,
}: HostParticipantSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard label="전체 신청" value={total} />
      <StatCard label="승인 대기" value={pending} />
      <StatCard
        label="승인"
        value={
          maxParticipants != null
            ? `${approved} / ${maxParticipants}`
            : approved
        }
      />
      <StatCard label="대련 찾기" value={sparring} />
    </div>
  );
}

export type { RegistrationStatus };

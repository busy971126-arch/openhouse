type HostParticipantStatsProps = {
  approved: number;
  pending: number;
  cancelled: number;
  maxParticipants: number | null;
};

export function HostParticipantStats({
  approved,
  pending,
  cancelled,
  maxParticipants,
}: HostParticipantStatsProps) {
  const totalActive = approved + pending;
  const capacityLabel =
    maxParticipants != null
      ? `${totalActive} / ${maxParticipants}명`
      : `${totalActive}명`;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">참가 현황</h2>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{capacityLabel}</p>
      <p className="mt-1 text-sm text-zinc-600">
        확정 {approved}명 · 대기 {pending}명 · 취소 {cancelled}명
      </p>
    </section>
  );
}

type DashboardSummaryProps = {
  gymCount: number;
  operatingEventCount: number;
  totalApplications: number;
  pendingApprovals: number;
};

export function DashboardSummary({
  gymCount,
  operatingEventCount,
  totalApplications,
  pendingApprovals,
}: DashboardSummaryProps) {
  const items = [
    { emoji: "🏢", label: "체육관", value: `${gymCount}개` },
    { emoji: "📅", label: "운영 중", value: `${operatingEventCount}개` },
    { emoji: "👥", label: "참가 신청", value: `${totalApplications}명` },
    { emoji: "⏳", label: "승인 대기", value: `${pendingApprovals}명` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-zinc-200 bg-white p-3"
        >
          <p className="text-xs text-zinc-500">
            {item.emoji} {item.label}
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

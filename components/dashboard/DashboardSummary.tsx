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
    { label: "체육관", value: `${gymCount}개` },
    { label: "운영 중", value: `${operatingEventCount}개` },
    { label: "참가 신청", value: `${totalApplications}명` },
    { label: "승인 대기", value: `${pendingApprovals}명` },
  ];

  return (
    <section className="grid grid-cols-2 border-y border-zinc-200">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`py-3 ${index % 2 === 0 ? "pr-4" : "border-l border-zinc-200 pl-4"} ${index < 2 ? "border-b border-zinc-200" : ""}`}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
            {item.label}
          </p>
          <p className="mt-1 text-xl font-black tracking-[-0.03em] text-zinc-950">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}

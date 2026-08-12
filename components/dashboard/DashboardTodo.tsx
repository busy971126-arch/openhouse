type DashboardTodoProps = {
  pendingApprovals: number;
  tomorrowEvents: number;
};

export function DashboardTodo({
  pendingApprovals,
  tomorrowEvents,
}: DashboardTodoProps) {
  const items = [
    pendingApprovals > 0 && `승인 대기 ${pendingApprovals}명`,
    tomorrowEvents > 0 && `내일 진행 일정 ${tomorrowEvents}개`,
  ].filter(Boolean) as string[];

  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">오늘 해야 할 일</h2>
        <p className="mt-2 text-sm text-zinc-600">지금 처리할 일이 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">오늘 해야 할 일</h2>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 text-sm text-zinc-700 before:content-['•']"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

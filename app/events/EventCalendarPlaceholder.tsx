export function EventCalendarPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
      <p className="text-lg font-semibold text-zinc-900">캘린더 뷰 준비 중</p>
      <p className="mt-2 max-w-xs text-sm text-zinc-600">
        날짜별로 이벤트를 한눈에 볼 수 있는 캘린더는 곧 추가됩니다. 지금은
        목록에서 찾아보세요.
      </p>
    </div>
  );
}

import type { ApplyPreviewHint } from "@/lib/utils/apply-preview-hint";

type ApplyPreviewHintBoxProps = {
  hint: ApplyPreviewHint;
};

export function ApplyPreviewHintBox({ hint }: ApplyPreviewHintBoxProps) {
  return (
    <div className="rounded-lg border border-orange-100 bg-orange-50 px-3 py-3 text-sm">
      <p className="font-medium text-orange-900">{hint.title}</p>
      {hint.detail && (
        <p className="mt-1 text-xs text-orange-800">{hint.detail}</p>
      )}
      <a
        href="#participant-preview"
        className="mt-2 inline-block text-xs font-medium text-orange-700 underline hover:text-orange-800"
      >
        예정 참가자 구성 미리보기 보기
      </a>
    </div>
  );
}

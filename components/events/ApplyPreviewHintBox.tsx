import type { ApplyPreviewHint } from "@/lib/utils/apply-preview-hint";

type ApplyPreviewHintBoxProps = {
  hint: ApplyPreviewHint;
};

export function ApplyPreviewHintBox({ hint }: ApplyPreviewHintBoxProps) {
  return (
    <div className="border-l-2 border-orange-600 py-1 pl-4">
      <p className="text-[10px] font-black tracking-[0.14em] text-orange-600">BEFORE YOU JOIN</p>
      <p className="mt-1 text-sm font-bold text-zinc-950">{hint.title}</p>
      {hint.detail && (
        <p className="mt-1 text-xs leading-5 text-zinc-500">{hint.detail}</p>
      )}
      <a
        href="#participant-preview"
        className="mt-2 inline-block text-xs font-bold text-zinc-600 underline decoration-zinc-300 underline-offset-4 hover:text-orange-600"
      >
        참가자 구성 보기
      </a>
    </div>
  );
}

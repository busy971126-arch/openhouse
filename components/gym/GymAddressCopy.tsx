"use client";

import { useState } from "react";

type GymAddressCopyProps = {
  address: string;
};

export function GymAddressCopy({ address }: GymAddressCopyProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-2 flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      <p className="min-w-0 flex-1 select-all text-sm leading-relaxed text-zinc-800">
        {address}
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        {copied ? "복사됨 ✓" : "주소 복사"}
      </button>
    </div>
  );
}

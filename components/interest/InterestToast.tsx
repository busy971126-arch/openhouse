"use client";

import { useEffect, useState } from "react";

type InterestToastProps = {
  message: string | null;
  onDismiss: () => void;
};

export function InterestToast({ message, onDismiss }: InterestToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDismiss, 2400);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-1/2 z-50 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg"
    >
      {message}
    </div>
  );
}

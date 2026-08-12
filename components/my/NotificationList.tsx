"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import type { NotificationRow } from "@/lib/queries/notifications";

type NotificationListProps = {
  notifications: NotificationRow[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markRead(id: string) {
    setLoadingId(id);

    const supabase = createClient();
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);

    setLoadingId(null);

    if (!error) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, read_at: new Date().toISOString() }
            : item,
        ),
      );
      router.refresh();
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-zinc-600">새로운 알림이 없습니다.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const isUnread = !item.read_at;
        const content = (
          <>
            <p className="font-medium text-zinc-900">{item.title}</p>
            {item.body && (
              <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
            )}
            <time className="mt-2 block text-xs text-zinc-400">
              {new Date(item.created_at).toLocaleString("ko-KR")}
            </time>
          </>
        );

        return (
          <li
            key={item.id}
            className={`rounded-xl border px-4 py-3 ${
              isUnread
                ? "border-orange-200 bg-orange-50"
                : "border-zinc-200 bg-white"
            }`}
          >
            {item.link ? (
              <Link href={item.link} className="block">
                {content}
              </Link>
            ) : (
              content
            )}
            {isUnread && (
              <button
                type="button"
                disabled={loadingId === item.id}
                onClick={() => markRead(item.id)}
                className="mt-2 text-xs font-medium text-orange-600 disabled:opacity-50"
              >
                {loadingId === item.id ? "처리 중..." : "읽음 처리"}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

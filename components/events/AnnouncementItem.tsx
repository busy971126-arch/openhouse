"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";

type AnnouncementItemProps = {
  id: string;
  content: string;
  createdAt: string;
};

export function AnnouncementItem({
  id,
  content,
  createdAt,
}: AnnouncementItemProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("announcements")
      .update({ content: draft.trim() })
      .eq("id", id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("공지를 삭제하시겠습니까?")) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    setLoading(false);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    router.refresh();
  }

  return (
    <li className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleUpdate}
              className="flex-1 rounded-lg bg-zinc-900 py-1.5 text-xs text-white disabled:opacity-50"
            >
              저장
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setDraft(content);
                setEditing(false);
              }}
              className="flex-1 rounded-lg border border-zinc-300 py-1.5 text-xs"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap">{content}</p>
          <time className="mt-1 block text-xs text-zinc-400">
            {new Date(createdAt).toLocaleDateString("ko-KR")}
          </time>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-orange-600"
            >
              수정
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleDelete}
              className="text-xs font-medium text-red-600"
            >
              삭제
            </button>
          </div>
        </>
      )}
      {error && (
        <div className="mt-2">
          <Alert message={error} />
        </div>
      )}
    </li>
  );
}

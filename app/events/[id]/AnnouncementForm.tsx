"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";

type AnnouncementFormProps = {
  eventId: string;
  userId: string;
};

export function AnnouncementForm({ eventId, userId }: AnnouncementFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("announcements").insert({
      event_id: eventId,
      author_id: userId,
      content: content.trim(),
    });

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setContent("");
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      {error && <Alert message={error} />}
      {success && (
        <Alert
          message="공지가 등록되었습니다. 예정 참가자에게 알림이 전송됩니다."
          variant="success"
        />
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        placeholder="예정 참가자에게 전달할 공지를 작성하세요"
        className="min-h-[80px] rounded-lg border border-zinc-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {loading ? "등록 중..." : "공지 작성"}
      </button>
    </form>
  );
}

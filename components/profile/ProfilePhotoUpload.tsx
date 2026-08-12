"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_PHOTOS = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

type ProfilePhotoUploadProps = {
  userId: string;
};

export function ProfilePhotoUpload({ userId }: ProfilePhotoUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(selected: FileList | null) {
    if (!selected?.length) return;

    const files = Array.from(selected)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, MAX_PHOTOS);

    if (files.length === 0) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setError("사진은 한 장당 5MB 이하만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const photoUrls: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-feed-photos")
        .upload(path, file);

      if (uploadError) {
        setError("사진 업로드에 실패했습니다.");
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("profile-feed-photos")
        .getPublicUrl(path);
      photoUrls.push(data.publicUrl);
    }

    const { error: insertError } = await supabase
      .from("profile_feed_posts")
      .insert({
        user_id: userId,
        post_type: "photo",
        photo_urls: photoUrls,
      });

    if (insertError) {
      setError("피드에 사진을 등록하지 못했습니다.");
      setUploading(false);
      return;
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
      <p className="text-sm font-medium text-zinc-800">운동 사진 올리기</p>
      <p className="mt-1 text-xs text-zinc-500">
        최대 {MAX_PHOTOS}장 · 이벤트 참가 기록과 함께 피드에 표시됩니다.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="mt-3 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-orange-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-orange-700"
        disabled={uploading}
        onChange={(event) => void handleFiles(event.target.files)}
      />
      {uploading && (
        <p className="mt-2 text-xs text-zinc-500">업로드 중…</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

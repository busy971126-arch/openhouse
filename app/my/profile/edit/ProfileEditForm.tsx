"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/Alert";
import { NicknameField } from "@/components/NicknameField";
import { ProfileBioInput } from "@/components/profile/ProfileBioInput";

export default function ProfileEditForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login?redirect=/my/profile/edit");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("nickname, bio, photo_url")
        .eq("id", user.id)
        .single();

      if (fetchError || !data) {
        router.push("/my/profile");
        return;
      }

      setUserId(user.id);
      setNickname(data.nickname ?? "");
      setVerifiedNickname(data.nickname?.trim() ? data.nickname.trim() : null);
      setBio(data.bio ?? "");
      setPhotoUrl(data.photo_url ?? "");
      setPhotoPreview(data.photo_url ?? null);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setPendingPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function uploadPhoto(file: File, ownerId: string) {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${ownerId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { upsert: true });
    if (uploadError) return null;
    return supabase.storage.from("profile-photos").getPublicUrl(path).data.publicUrl;
  }

  async function resolveNicknameForSave(): Promise<string | null> {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("닉네임을 입력해주세요.");
      return null;
    }

    if (verifiedNickname !== null && trimmed === verifiedNickname) {
      return verifiedNickname;
    }

    const response = await fetch("/api/nickname/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: trimmed }),
    });
    const data = await response.json();

    if (!response.ok || !data.available) {
      setError(data.error ?? "닉네임 중복확인이 필요합니다.");
      return null;
    }

    const resolved = data.nickname as string;
    setNickname(resolved);
    setVerifiedNickname(resolved);
    return resolved;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) return;

    const resolvedNickname = await resolveNicknameForSave();
    if (!resolvedNickname) return;

    setSaving(true);
    let nextPhotoUrl = photoUrl.trim() || null;

    if (pendingPhoto) {
      const uploaded = await uploadPhoto(pendingPhoto, userId);
      if (!uploaded) {
        setSaving(false);
        setError("프로필 사진 업로드에 실패했습니다.");
        return;
      }
      nextPhotoUrl = uploaded;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        nickname: resolvedNickname,
        bio: bio.trim() || null,
        photo_url: nextPhotoUrl,
      })
      .eq("id", userId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/my/profile");
    router.refresh();
  }

  if (loading) return <p className="text-sm text-zinc-600">불러오는 중...</p>;

  return (
    <div className="mx-auto max-w-md">
      <Link href="/my/profile" className="text-sm font-medium text-orange-600 hover:text-orange-700">
        ← 프로필
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-zinc-900">프로필 관리</h1>
      <p className="mt-1 text-sm text-zinc-500">보이는 프로필과 운동 정보를 나눠서 관리할 수 있어요.</p>

      <div className="mt-5 grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-sm font-medium">
        <span className="rounded-lg bg-white px-3 py-2 text-center text-zinc-900 shadow-sm">기본 프로필</span>
        <Link href="/my/profile/edit/sports" className="rounded-lg px-3 py-2 text-center text-zinc-500 hover:text-zinc-900">
          운동 프로필
        </Link>
      </div>

      {error && <div className="mt-4"><Alert message={error} /></div>}

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col items-center gap-3">
            {photoPreview ? (
              <img src={photoPreview} alt="프로필" className="size-24 rounded-full border border-zinc-200 object-cover" />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-zinc-100 text-2xl text-zinc-400">👤</div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-orange-600">
              프로필 사진 변경
            </button>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            <NicknameField
              value={nickname}
              onChange={setNickname}
              verifiedNickname={verifiedNickname}
              onVerifiedChange={setVerifiedNickname}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-800">소개</p>
              <ProfileBioInput value={bio} onChange={setBio} />
            </div>
          </div>
        </section>

        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-sm font-medium text-zinc-900">운동 정보는 따로 관리해요</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-600">
            종목, 수련 경력, 체급, 활동 지역은 운동 프로필에서 언제든 추가하거나 바꿀 수 있습니다.
          </p>
          <Link href="/my/profile/edit/sports" className="mt-3 inline-block text-sm font-medium text-orange-600">
            운동 프로필 수정 →
          </Link>
        </div>

        <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 py-3 font-medium text-white hover:bg-orange-700 disabled:opacity-50">
          {saving ? "저장 중..." : "기본 프로필 저장"}
        </button>
      </form>
    </div>
  );
}

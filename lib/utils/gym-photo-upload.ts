import { createClient } from "@/lib/supabase/client";
import type { GymOptionalPhotoCategory } from "@/lib/constants/gym-photos";
import type { GymPhotoItem } from "@/lib/utils/gym-photo-items";

export async function uploadGymPhotoFile(
  file: File,
  ownerId: string,
  gymId: string,
  category: "representative" | GymOptionalPhotoCategory,
  index: number,
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${ownerId}/${gymId}/${category}/${Date.now()}-${index}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("gym-photos")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { url: null, error: uploadError.message };
  }

  const { data } = supabase.storage.from("gym-photos").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export type OptionalPhotoUploads = Record<
  GymOptionalPhotoCategory,
  GymPhotoItem[]
>;

export async function uploadOptionalGymPhotos(
  ownerId: string,
  gymId: string,
  existing: OptionalPhotoUploads,
  pending: Record<GymOptionalPhotoCategory, { file: File; caption: string }[]>,
): Promise<{ photos: OptionalPhotoUploads; error: string | null }> {
  const result: OptionalPhotoUploads = {
    mat: [...existing.mat],
    facilities: [...existing.facilities],
    exterior: [...existing.exterior],
    parking: [...existing.parking],
  };

  for (const category of Object.keys(pending) as GymOptionalPhotoCategory[]) {
    for (let index = 0; index < pending[category].length; index += 1) {
      const { file, caption } = pending[category][index];
      const { url, error } = await uploadGymPhotoFile(
        file,
        ownerId,
        gymId,
        category,
        index,
      );
      if (error || !url) {
        return { photos: result, error: error ?? "사진 업로드에 실패했습니다." };
      }
      result[category].push({ url, caption: caption.trim() });
    }
  }

  return { photos: result, error: null };
}

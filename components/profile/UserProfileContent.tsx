import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FriendAddButton } from "@/components/profile/FriendAddButton";
import { ProfileFeed } from "@/components/profile/ProfileFeed";
import {
  ProfileInfoRow,
  ProfileSection,
  ProfileStatRow,
} from "@/components/profile/ProfileSection";
import { createClient } from "@/lib/supabase/server";
import {
  getFriendCount,
  getFriendshipState,
  type FriendshipState,
} from "@/lib/queries/friends";
import { getProfileFeed } from "@/lib/queries/profile-feed";
import { getPublicProfile } from "@/lib/queries/public-profile";
import {
  formatProfileRegions,
  getSportEmoji,
  GYM_OPERATOR_EXPERIENCE,
} from "@/lib/constants/profile";
import {
  formatHostIdentitySubtitle,
  formatRepresentativeRoleLabel,
} from "@/lib/constants/gym-representative";
import {
  canViewProfileField,
  getProfileViewContext,
  maskProfileValue,
} from "@/lib/utils/profile-visibility";
import {
  formatProfileJoinDate,
  formatProfileTrainingBackground,
  formatProfileTrainingYears,
} from "@/lib/utils/profile-display";

type UserProfileContentProps = {
  userId: string;
  backHref: string;
  backLabel: string;
  isOwner?: boolean;
};

export async function UserProfileContent({
  userId,
  backHref,
  backLabel,
  isOwner = false,
}: UserProfileContentProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirect=/users/${userId}`);

  const publicData = await getPublicProfile(userId);
  if (!publicData) notFound();

  const { profile, stats, primaryGym } = publicData;

  if (
    isOwner &&
    stats.isGymOperator &&
    profile.experience !== GYM_OPERATOR_EXPERIENCE
  ) {
    await supabase
      .from("profiles")
      .update({ experience: GYM_OPERATOR_EXPERIENCE })
      .eq("id", userId);
    profile.experience = GYM_OPERATOR_EXPERIENCE;
  }

  const [feedItems, friendCount, friendshipState] = await Promise.all([
    getProfileFeed(userId),
    getFriendCount(userId),
    isOwner
      ? Promise.resolve("self" as FriendshipState)
      : getFriendshipState(user.id, userId),
  ]);

  const nicknameTrim = profile.nickname?.trim() ?? "";
  const displayNameTrim = profile.display_name?.trim() ?? "";
  const publicLabel = nicknameTrim || displayNameTrim || "회원";
  const isGymOperator = stats.isGymOperator;

  const operatorRoleLabel = primaryGym
    ? formatRepresentativeRoleLabel(
        primaryGym.representative_role,
        primaryGym.representative_role_custom,
      )
    : null;
  const hostSubtitle = isGymOperator
    ? formatHostIdentitySubtitle(
        primaryGym?.representative_role,
        primaryGym?.representative_role_custom,
      )
    : null;
  const sport = profile.preferred_sports?.[0];
  const sportEmoji = sport ? getSportEmoji(sport) : "🥋";
  const viewContext = getProfileViewContext({
    isSelf: isOwner,
    isFriend: friendshipState === "friends",
  });
  const visibilitySettings = profile.visibility_settings;

  const visibleSport = maskProfileValue(
    sport,
    "preferred_sports",
    visibilitySettings,
    viewContext,
  );
  const visibleWeightClass = maskProfileValue(
    profile.weight_class,
    "weight_class",
    visibilitySettings,
    viewContext,
  );
  const visibleExperienceRaw = maskProfileValue(
    profile.experience,
    "experience",
    visibilitySettings,
    viewContext,
  );
  const regions = formatProfileRegions(profile.regions);
  const visibleRegions = canViewProfileField(
    "regions",
    visibilitySettings,
    viewContext,
  )
    ? regions
    : null;
  const trainingYears = visibleExperienceRaw
    ? formatProfileTrainingYears(visibleExperienceRaw)
    : null;
  const trainingBackground = visibleExperienceRaw
    ? formatProfileTrainingBackground(
        visibleExperienceRaw,
        operatorRoleLabel,
        isGymOperator,
      )
    : null;
  const visiblePrimaryGym = canViewProfileField(
    "gym_affiliation",
    visibilitySettings,
    viewContext,
  )
    ? primaryGym
    : null;
  const visibleBio = maskProfileValue(
    profile.bio,
    "bio",
    visibilitySettings,
    viewContext,
  );
  const joinDate = formatProfileJoinDate(profile.created_at);

  const hasSportInfo =
    visibleSport ||
    visibleWeightClass ||
    trainingYears ||
    trainingBackground ||
    visiblePrimaryGym ||
    visibleRegions;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <Link
        href={backHref}
        className="text-sm font-medium text-orange-600 hover:text-orange-700"
      >
        {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">
          {isOwner ? "프로필" : publicLabel}
        </h1>
        {isOwner ? (
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Link
              href="/my/profile/edit"
              className="rounded-lg border border-orange-200 px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              프로필 수정
            </Link>
            <Link
              href={`/users/${userId}`}
              className="text-xs font-medium text-zinc-500 hover:text-orange-600"
            >
              공개 프로필 보기
            </Link>
          </div>
        ) : (
          <FriendAddButton
            viewerId={user.id}
            targetId={userId}
            initialState={friendshipState}
          />
        )}
      </div>

      <article className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col items-center text-center">
          {profile.photo_url ? (
            <img
              src={profile.photo_url}
              alt="프로필"
              className="size-24 rounded-full border border-zinc-200 object-cover"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-zinc-100 text-4xl">
              👤
            </div>
          )}

          <p className="mt-4 text-xl font-bold text-zinc-900">{publicLabel}</p>

          {hostSubtitle && (
            <p className="mt-1 text-sm font-medium text-orange-600">
              {sportEmoji} {hostSubtitle}
            </p>
          )}
        </div>

        {hasSportInfo && (
          <div className="mt-5 divide-y divide-zinc-100 border-t border-zinc-100 pt-4">
            {visibleSport && (
              <ProfileInfoRow emoji="🥋" label="종목" value={visibleSport} />
            )}
            {visibleWeightClass && (
              <ProfileInfoRow
                emoji="⚖️"
                label="체급"
                value={visibleWeightClass}
              />
            )}
            {trainingYears && (
              <ProfileInfoRow
                emoji="📈"
                label="수련 경력"
                value={trainingYears}
              />
            )}
            {trainingBackground && !isGymOperator && (
              <ProfileInfoRow
                emoji="🏷️"
                label="수련 배경"
                value={trainingBackground}
              />
            )}
            {visiblePrimaryGym && (
              <ProfileInfoRow
                emoji="🏠"
                label={isGymOperator ? "체육관" : "소속 체육관"}
                value={visiblePrimaryGym.name}
              />
            )}
            {visibleRegions && (
              <ProfileInfoRow emoji="📍" label="활동 지역" value={visibleRegions} />
            )}
          </div>
        )}
      </article>

      <ProfileSection title="활동">
        <div className="divide-y divide-zinc-100">
          <ProfileStatRow
            emoji="👥"
            label="참가 이벤트"
            value={`${stats.participationCount}회`}
          />
          {isGymOperator && (
            <ProfileStatRow
              emoji="🏆"
              label="운영 이벤트"
              value={`${stats.operationCount}회`}
            />
          )}
          <ProfileStatRow
            emoji="🤝"
            label="운동 친구"
            value={`${friendCount}명`}
          />
          {joinDate && (
            <ProfileStatRow emoji="📅" label="가입일" value={joinDate} />
          )}
        </div>
      </ProfileSection>

      <ProfileSection title="소개">
        {visibleBio?.trim() ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">
            {visibleBio}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">소개글이 없습니다.</p>
        )}
      </ProfileSection>

      {isOwner && (
        <ProfileSection title="운동 친구">
          <ProfileStatRow
            emoji="🤝"
            label="운동 친구"
            value={`${friendCount}명`}
          />
          <Link
            href="/my/friends"
            className="mt-3 block w-full rounded-lg border border-zinc-200 py-2.5 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            운동 친구 관리
          </Link>
        </ProfileSection>
      )}

      <ProfileFeed
        items={feedItems}
        canUpload={isOwner}
        userId={isOwner ? userId : undefined}
      />

      {isOwner && (
        <ProfileSection title="더 보기">
          <div className="flex flex-col gap-2">
            <ProfileLink href="/my/registrations" label="참여한 이벤트" />
            {isGymOperator && primaryGym && (
              <ProfileLink
                href={`/host/gyms/${primaryGym.id}/events`}
                label="운영한 이벤트"
              />
            )}
            <ProfileLink href="/my/interests" label="관심" />
          </div>
        </ProfileSection>
      )}

      {isOwner && primaryGym && isGymOperator && (
        <ProfileSection title="체육관 관리">
          <div className="flex flex-col gap-2">
            <Link
              href={`/host/gyms/${primaryGym.id}`}
              className="rounded-lg bg-orange-600 py-2.5 text-center text-sm font-medium text-white hover:bg-orange-700"
            >
              체육관 관리
            </Link>
            <Link
              href={`/gym/${primaryGym.id}`}
              className="rounded-lg border border-zinc-300 py-2.5 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              체육관 공개 페이지
            </Link>
          </div>
        </ProfileSection>
      )}

      {isOwner && !isGymOperator && (
        <section className="rounded-xl border border-dashed border-zinc-300 bg-white p-4">
          <p className="text-sm font-medium text-zinc-900">
            체육관 운영자이신가요?
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            체육관을 등록하면 이벤트를 만들고 예정 참가자를 관리할 수 있습니다.
          </p>
          <Link
            href="/gym/new"
            className="mt-3 inline-block text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            체육관 등록하기 →
          </Link>
        </section>
      )}
    </div>
  );
}

function ProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
    >
      {label}
    </Link>
  );
}

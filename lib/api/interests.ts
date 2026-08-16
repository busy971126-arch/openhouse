export type InterestToggleResponse = {
  interested: boolean;
};

export type GymInterestItem = {
  gym_id: string;
  created_at: string;
  gyms: {
    id: string;
    name: string;
    region: string;
    sport: string;
    address: string | null;
    photo_url: string | null;
    mat_photos: unknown;
    facility_photos: unknown;
    exterior_photos: unknown;
    parking_photos: unknown;
  } | null;
};

export type EventInterestItem = {
  event_id: string;
  created_at: string;
  events: {
    id: string;
    title: string;
    sport: string;
    region: string;
    event_date: string;
    event_type: string;
    max_participants: number | null;
    recruitment_closed: boolean;
    registration_deadline: string | null;
    status: string | null;
  } | null;
};

export async function toggleGymInterest(
  gymId: string,
): Promise<InterestToggleResponse> {
  const response = await fetch(`/api/gyms/${gymId}/interest`, {
    method: "POST",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "관심 등록에 실패했습니다.");
  }

  return response.json() as Promise<InterestToggleResponse>;
}

export async function toggleEventInterest(
  eventId: string,
): Promise<InterestToggleResponse> {
  const response = await fetch(`/api/events/${eventId}/interest`, {
    method: "POST",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "관심 등록에 실패했습니다.");
  }

  return response.json() as Promise<InterestToggleResponse>;
}

export async function fetchMyGymInterests(): Promise<GymInterestItem[]> {
  const response = await fetch("/api/users/me/interests/gyms");
  if (!response.ok) {
    throw new Error("관심 체육관 목록을 불러오지 못했습니다.");
  }
  const body = (await response.json()) as { data: GymInterestItem[] };
  return body.data;
}

export async function fetchMyEventInterests(): Promise<EventInterestItem[]> {
  const response = await fetch("/api/users/me/interests/events");
  if (!response.ok) {
    throw new Error("관심 이벤트 목록을 불러오지 못했습니다.");
  }
  const body = (await response.json()) as { data: EventInterestItem[] };
  return body.data;
}

"use client";

const GEOLOCATION_ERRORS: Record<number, string> = {
  1: "위치 권한이 거부되었습니다. 브라우저 설정에서 위치 접근을 허용해주세요.",
  2: "위치 정보를 가져올 수 없습니다.",
  3: "위치 요청 시간이 초과되었습니다.",
};

export type CurrentPosition = {
  latitude: number;
  longitude: number;
};

export function requestCurrentPosition(): Promise<CurrentPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 서비스를 지원하지 않습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(
          new Error(
            GEOLOCATION_ERRORS[error.code] ??
              "현재 위치를 확인하지 못했습니다.",
          ),
        );
      },
      {
        enableHighAccuracy: false,
        timeout: 12_000,
        maximumAge: 60_000,
      },
    );
  });
}

export async function resolveRegionFromCurrentPosition(): Promise<string> {
  const { latitude, longitude } = await requestCurrentPosition();

  const response = await fetch(
    `/api/geocode/reverse?lat=${encodeURIComponent(String(latitude))}&lng=${encodeURIComponent(String(longitude))}`,
  );

  const payload = (await response.json()) as {
    region?: string;
    error?: string;
  };

  if (!response.ok || !payload.region) {
    throw new Error(
      payload.error ?? "현재 위치의 지역을 확인하지 못했습니다.",
    );
  }

  return payload.region;
}

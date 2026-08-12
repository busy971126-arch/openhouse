import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/utils/reverse-geocode";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "위치 좌표가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: "위치 좌표가 올바르지 않습니다." },
      { status: 400 },
    );
  }

  try {
    const { region, source } = await reverseGeocode(lat, lng);

    if (!region) {
      return NextResponse.json(
        {
          error:
            "현재 위치의 지역을 확인하지 못했습니다. 지역 필터를 직접 선택해주세요.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ region, source });
  } catch {
    return NextResponse.json(
      { error: "위치 변환 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

import { deriveRegionFromPostcode } from "@/lib/utils/address-region";

type KakaoRegionDocument = {
  region_1depth_name: string;
  region_2depth_name: string;
};

type NominatimAddress = {
  state?: string;
  city?: string;
  county?: string;
  borough?: string;
};

export function regionFromKakaoDocument(doc: KakaoRegionDocument): string {
  return deriveRegionFromPostcode({
    sido: doc.region_1depth_name,
    sigungu: doc.region_2depth_name,
  });
}

export function regionFromNominatimAddress(address: NominatimAddress): string | null {
  const sido = address.state?.trim();
  if (!sido) return null;

  const sigungu =
    address.city?.trim() ||
    address.borough?.trim() ||
    address.county?.trim() ||
    "";

  return deriveRegionFromPostcode({ sido, sigungu });
}

export async function reverseGeocodeWithKakao(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<string | null> {
  const url = new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json");
  url.searchParams.set("x", String(longitude));
  url.searchParams.set("y", String(latitude));

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    documents?: KakaoRegionDocument[];
  };

  const doc = payload.documents?.[0];
  if (!doc) return null;

  return regionFromKakaoDocument(doc);
}

export async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "json");
  url.searchParams.set("accept-language", "ko");

  const response = await fetch(url, {
    headers: { "User-Agent": "OpenHouse/1.0 (contact: openhouse-mvp)" },
    next: { revalidate: 0 },
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { address?: NominatimAddress };
  if (!payload.address) return null;

  return regionFromNominatimAddress(payload.address);
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<{ region: string | null; source: "kakao" | "nominatim" | null }> {
  const kakaoKey = process.env.KAKAO_REST_API_KEY?.trim();

  if (kakaoKey) {
    const region = await reverseGeocodeWithKakao(latitude, longitude, kakaoKey);
    if (region) return { region, source: "kakao" };
  }

  const region = await reverseGeocodeWithNominatim(latitude, longitude);
  return { region, source: region ? "nominatim" : null };
}

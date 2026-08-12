/** Daum 우편번호 검색 결과에서 OpenHouse region 형식으로 변환 */
const SIDO_SHORT: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  강원도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
};

export type PostcodeResult = {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
  bname: string;
  buildingName: string;
};

export type GymAddressValue = {
  zonecode: string;
  roadAddress: string;
  addressDetail: string;
  region: string;
};

export function createEmptyGymAddress(): GymAddressValue {
  return {
    zonecode: "",
    roadAddress: "",
    addressDetail: "",
    region: "",
  };
}

function normalizeSigungu(sigungu: string): string {
  const primary = sigungu.split(" ")[0] ?? sigungu;
  return primary.replace(/(특별자치)?시$|군$|구$/, "");
}

export function deriveRegionFromPostcode(data: {
  sido: string;
  sigungu: string;
}): string {
  const province = SIDO_SHORT[data.sido] ?? data.sido.replace(/특별자치|특별|광역/g, "").replace(/(시|도)$/, "");
  const district = normalizeSigungu(data.sigungu);

  if (province === "세종") return "세종";
  if (!district || district === province) return province;

  return `${province} ${district}`;
}

export function formatGymAddress(value: GymAddressValue): string {
  return [value.roadAddress, value.addressDetail.trim()]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function gymAddressFromStored(
  address: string | null | undefined,
  region: string | null | undefined,
): GymAddressValue {
  return {
    zonecode: "",
    roadAddress: address?.trim() ?? "",
    addressDetail: "",
    region: region?.trim() ?? "",
  };
}

export function applyPostcodeResult(
  current: GymAddressValue,
  data: PostcodeResult,
): GymAddressValue {
  const roadAddress = data.roadAddress || data.jibunAddress;
  return {
    ...current,
    zonecode: data.zonecode,
    roadAddress,
    region: deriveRegionFromPostcode(data),
  };
}

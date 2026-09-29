const countryLabels: Record<string, string> = {
  "United States": "미국",
  "United States of America": "미국",
  USA: "미국",
  US: "미국",
  "U.S.": "미국",
  Japan: "일본",
  Canada: "캐나다",
  Ireland: "아일랜드",
  "United Kingdom": "영국",
  UK: "영국",
  England: "영국",
  Germany: "독일",
  France: "프랑스",
  Spain: "스페인",
  Italy: "이탈리아",
  Netherlands: "네덜란드",
  Sweden: "스웨덴",
  Denmark: "덴마크",
  Norway: "노르웨이",
  Finland: "핀란드",
  Switzerland: "스위스",
  Belgium: "벨기에",
  Austria: "오스트리아",
  Poland: "폴란드",
  Portugal: "포르투갈",
  "Czech Republic": "체코",
  Singapore: "싱가포르",
  India: "인도",
  Brazil: "브라질",
  Argentina: "아르헨티나",
  Mexico: "멕시코",
  Colombia: "콜롬비아",
  Chile: "칠레",
  China: "중국",
  Taiwan: "대만",
  "Hong Kong": "홍콩",
  "South Korea": "한국",
  Korea: "한국",
  Australia: "호주",
  "New Zealand": "뉴질랜드",
  Philippines: "필리핀",
  Indonesia: "인도네시아",
  Thailand: "태국",
  Vietnam: "베트남",
  Malaysia: "말레이시아",
  Israel: "이스라엘",
  "United Arab Emirates": "아랍에미리트",
  UAE: "아랍에미리트",
  "South Africa": "남아프리카공화국",
  Remote: "원격",
  "Not specified": "미기재"
};

export function countryLabel(country: string | null | undefined): string {
  const value = country?.trim();
  if (!value) return "미기재";
  if (countryLabels[value]) return countryLabels[value];

  const separator = value.includes("/") ? "/" : value.includes(",") ? "," : null;
  if (separator) {
    return value
      .split(separator)
      .map((part) => countryLabel(part.trim()))
      .join(separator === "/" ? " / " : ", ");
  }

  return value;
}

export function workTypeLabel(workType: string | null | undefined): string {
  const value = workType?.trim();
  if (!value) return "미기재";
  const labels: Record<string, string> = {
    Onsite: "오피스 근무",
    "On-site": "오피스 근무",
    "On-site / Not specified": "오피스 근무 또는 미기재",
    Hybrid: "하이브리드",
    Remote: "원격",
    "Remote-first": "원격 우선",
    "Not specified": "미기재"
  };
  return labels[value] ?? value;
}

export function startDateLabel(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "미기재";
  const labels: Record<string, string> = {
    Immediately: "즉시 가능",
    "Within 1 month": "1개월 이내",
    "Within 3 months": "3개월 이내",
    "After 6 months": "6개월 이후",
    "Not specified": "미기재"
  };
  return labels[normalized] ?? normalized;
}

export function languageLevelLabel(level: string | null | undefined): string {
  const value = level?.trim();
  if (!value) return "미기재";
  const labels: Record<string, string> = {
    BASIC: "기초",
    CONVERSATIONAL: "일상 회화",
    BUSINESS: "비즈니스",
    FLUENT: "유창",
    NATIVE: "원어민"
  };
  return labels[value] ?? value;
}

export function preferenceLabel(preference: string | null | undefined): string {
  const value = preference?.trim();
  if (!value) return "미기재";
  const labels: Record<string, string> = {
    "Visa support": "비자 지원",
    Hybrid: "하이브리드",
    Remote: "원격",
    "Relocation support": "이주 지원",
    "Global team": "글로벌 팀",
    "High salary": "높은 연봉"
  };
  return labels[value] ?? value;
}

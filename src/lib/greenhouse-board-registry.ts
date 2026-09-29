export type GreenhouseBoardPreset = {
  company: string;
  boardToken: string;
  domain: string;
  note: string;
};

export const greenhouseBoardPresets: GreenhouseBoardPreset[] = [
  { company: "Airbnb", boardToken: "airbnb", domain: "Travel / Marketplace", note: "글로벌 숙박/여행 플랫폼의 엔지니어링 공고 확인" },
  { company: "Stripe", boardToken: "stripe", domain: "Fintech / Payments", note: "결제 인프라, 플랫폼, 데이터 직무 확인" },
  { company: "Reddit", boardToken: "reddit", domain: "Social / Community / AI", note: "커뮤니티, 검색, 추천, ML 관련 공고 확인" },
  { company: "Databricks", boardToken: "databricks", domain: "Data / AI Platform", note: "데이터 플랫폼, AI, 인프라 엔지니어링 공고 확인" },
  { company: "Figma", boardToken: "figma", domain: "Design / Collaboration", note: "프론트엔드, 데이터, AI 프로덕트 공고 확인" },
  { company: "Greenhouse", boardToken: "greenhouse", domain: "HR SaaS", note: "채용 SaaS 기업 자체 공고 확인" },
  { company: "Anthropic", boardToken: "anthropic", domain: "AI", note: "AI/ML, 인프라, 데이터 직무 확인" },
  { company: "DoorDash", boardToken: "doordashusa", domain: "Commerce / Logistics", note: "커머스, 물류, 플랫폼 공고 확인" },
  { company: "Asana", boardToken: "asana", domain: "Productivity / SaaS", note: "협업 SaaS, 프로덕트 엔지니어링 공고 확인" },
  { company: "Discord", boardToken: "discord", domain: "Social / Realtime", note: "실시간 커뮤니케이션, 플랫폼 공고 확인" },
  { company: "Duolingo", boardToken: "duolingo", domain: "EdTech / AI", note: "교육, AI, 모바일/플랫폼 공고 확인" },
  { company: "GitLab", boardToken: "gitlab", domain: "DevTools", note: "DevOps, 플랫폼, 보안 엔지니어링 공고 확인" },
  { company: "Mixpanel", boardToken: "mixpanel", domain: "Analytics SaaS", note: "제품 분석, 데이터 플랫폼 공고 확인" },
  { company: "Webflow", boardToken: "webflow", domain: "No-code / Web", note: "웹 플랫폼, 프론트엔드, 인프라 공고 확인" }
];

export const defaultGreenhouseBoardTokens = greenhouseBoardPresets.map((preset) => preset.boardToken);

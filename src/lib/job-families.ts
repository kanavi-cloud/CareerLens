export const jobFamilies = ["Backend", "Frontend", "AI/ML", "Data"];

const baseSkillSuggestions = [
  "AWS",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "MySQL",
  "PostgreSQL",
  "Redis",
  "GitHub Actions",
  "System Design",
  "Testing",
  "Observability"
];

const skillSuggestionsByFamily: Record<string, string[]> = {
  Backend: [
    "Java",
    "Spring Boot",
    "Kotlin",
    "Python",
    "Node.js",
    "REST API",
    "GraphQL",
    "Distributed Systems",
    "Kafka",
    "Microservices",
    "OpenSearch"
  ],
  Frontend: [
    "TypeScript",
    "React",
    "Next.js",
    "JavaScript",
    "Vue",
    "HTML/CSS",
    "Web Performance",
    "Design System",
    "Testing Library",
    "Accessibility"
  ],
  "AI/ML": [
    "Python",
    "Machine Learning",
    "PyTorch",
    "TensorFlow",
    "LLM",
    "MLOps",
    "Feature Engineering",
    "Model Evaluation",
    "Vector DB",
    "NLP"
  ],
  Data: [
    "SQL",
    "Python",
    "Spark",
    "Airflow",
    "ETL",
    "Data Pipeline",
    "Data Warehouse",
    "dbt",
    "BigQuery",
    "Snowflake"
  ]
};

const projectSuggestionsByFamily: Record<string, string[]> = {
  Backend: ["REST API", "분산 시스템", "클라우드 배포", "검색 플랫폼", "보안 서비스", "커머스 백엔드", "광고 이벤트 수집"],
  Frontend: ["대시보드 UI", "디자인 시스템", "상태 관리", "성능 최적화", "접근성 개선", "데이터 시각화", "결제/예약 플로우"],
  "AI/ML": ["추천 모델", "LLM 서비스", "모델 평가", "RAG 프로토타입", "MLOps 파이프라인", "AI 문서 분석", "임베딩 검색"],
  Data: ["데이터 파이프라인", "ETL 배치", "대시보드 지표", "로그 분석", "데이터 웨어하우스", "품질 검증", "실험 분석"]
};

const domainSuggestionsByFamily: Record<string, string[]> = {
  Backend: ["클라우드", "커머스", "광고", "보안", "B2B SaaS", "핀테크", "게임", "여행/예약"],
  Frontend: ["SaaS", "커머스", "콘텐츠", "핀테크", "디자인 시스템", "B2B 대시보드", "채용 플랫폼", "여행 서비스"],
  "AI/ML": ["AI 서비스", "추천 시스템", "검색", "문서 자동화", "데이터 제품", "생성형 AI", "MLOps", "개인화"],
  Data: ["데이터 플랫폼", "광고 분석", "프로덕트 분석", "로그 플랫폼", "BI", "실험 분석", "데이터 거버넌스"]
};

export function skillSuggestionsFor(jobFamily: string) {
  return unique([...(skillSuggestionsByFamily[jobFamily] ?? []), ...baseSkillSuggestions]);
}

export function projectSuggestionsFor(jobFamily: string) {
  return projectSuggestionsByFamily[jobFamily] ?? projectSuggestionsByFamily.Backend;
}

export function domainSuggestionsFor(jobFamily: string) {
  return domainSuggestionsByFamily[jobFamily] ?? domainSuggestionsByFamily.Backend;
}

function unique(values: string[]) {
  return values.filter((value, index, array) => array.indexOf(value) === index);
}

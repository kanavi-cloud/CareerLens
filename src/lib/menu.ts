export type MenuStatus = "active" | "next" | "planned";

export type MenuChild = {
  title: string;
  href: string;
  status: MenuStatus;
  description?: string;
  adminOnly?: boolean;
  children?: MenuChild[];
};

export type MenuItem = {
  title: string;
  href: string;
  status: MenuStatus;
  summary: string;
  children: MenuChild[];
};

export const mainMenus: MenuItem[] = [
  {
    title: "채용공고",
    href: "/jobs",
    status: "next",
    summary: "수동 조사 공고와 외부 공개 API 공고를 국가, 직무, 기술스택, 비자 조건으로 탐색합니다.",
    children: [
      {
        title: "전체 공고 조회",
        href: "/jobs",
        status: "next",
        description: "등록된 공고 전체를 필터로 조회하고 로드맵을 생성합니다."
      },
      {
        title: "인기 공고 조회",
        href: "/jobs/popular",
        status: "planned",
        description: "조회수와 추천 빈도 기반 인기 공고를 보여줍니다."
      },
      {
        title: "기업 상세",
        href: "/companies",
        status: "planned",
        description: "기업별 공고, 직원 표본, 패턴 근거를 묶어 보여줍니다."
      },
      {
        title: "외부 공고 API",
        href: "/jobs/import",
        status: "next",
        adminOnly: true,
        description: "관리자가 Greenhouse 공개 Job Board API 공고를 미리보기하고 DB에 등록합니다."
      }
    ]
  },
  {
    title: "맞춤추천",
    href: "/jobs/recommendation",
    status: "active",
    summary: "사용자 프로필과 공고별 PatternProfile을 비교해 추천 결과와 부족 요소를 진단합니다.",
    children: [
      {
        title: "적합도 진단",
        href: "/jobs/recommendation",
        status: "active",
        description: "CareerLens 핵심 추천/진단 엔진입니다."
      },
      {
        title: "비교 대시보드",
        href: "/recommendations/compare",
        status: "planned",
        description: "국가, 기업, 직무 조건을 사용자 프로필 기준으로 비교합니다."
      },
      {
        title: "맞춤 피드",
        href: "/recommendations/feed",
        status: "planned",
        description: "내 프로필 기반 준비 정보와 자료를 피드 형태로 제공합니다."
      }
    ]
  },
  {
    title: "준비로드맵",
    href: "/planner",
    status: "active",
    summary: "추천 진단 결과를 취업 준비, 출국 준비, 행정 정착 로드맵으로 연결합니다.",
    children: [
      {
        title: "로드맵 목록",
        href: "/planner",
        status: "active",
        description: "생성한 모든 로드맵을 확인합니다."
      },
      {
        title: "취업로드맵",
        href: "/roadmap/employment",
        status: "next",
        description: "커리어 플래너, 지원 관리, AI 문서 분석을 묶습니다.",
        children: [
          {
            title: "커리어 플래너",
            href: "/planner",
            status: "active",
            description: "추천 진단 기반 주차별 준비 과제"
          },
          {
            title: "AI 문서 분석",
            href: "/roadmap/employment/documents",
            status: "active",
            description: "이력서, 포트폴리오, GitHub 제출물 검증"
          },
          {
            title: "기업 지원 관리",
            href: "/applications",
            status: "next",
            description: "지원 상태와 서류 준비 관리"
          }
        ]
      },
      {
        title: "출국로드맵",
        href: "/roadmap/departure",
        status: "planned",
        description: "합격 이후 출국 일정과 항공 후보, 준비 항목을 관리합니다."
      },
      {
        title: "행정로드맵",
        href: "/roadmap/administration",
        status: "next",
        description: "비자, 행정, 초기 정착 체크리스트를 관리합니다."
      }
    ]
  },
  {
    title: "마이페이지",
    href: "/mypage",
    status: "active",
    summary: "해외취업 프로필, 관심 공고, 검증 배지, 계정 설정을 사용자별로 관리합니다.",
    children: [
      {
        title: "내 프로필",
        href: "/mypage",
        status: "active",
        description: "추천 진단에 사용할 해외취업 프로필을 입력합니다."
      },
      {
        title: "멤버십",
        href: "/membership",
        status: "active",
        description: "Pro 이용권과 월별 사용량을 확인합니다."
      },
      {
        title: "검증 배지",
        href: "/mypage/badges",
        status: "active",
        description: "AI 문서 분석과 과제 검증으로 발급된 배지를 확인합니다."
      },
      {
        title: "관심 공고",
        href: "/mypage/saved-jobs",
        status: "planned",
        description: "저장한 공고와 지원 후보를 관리합니다."
      },
      {
        title: "계정 설정",
        href: "/mypage/settings",
        status: "active",
        description: "이름, 이메일, 연락처와 비밀번호를 관리합니다."
      }
    ]
  },
  {
    title: "자료실",
    href: "/resources",
    status: "active",
    summary: "국가, 비자, Q&A, 공지 자료를 모아 해외취업 준비의 참고 자료로 제공합니다.",
    children: [
      {
        title: "공지사항",
        href: "/resources/notices",
        status: "active",
        description: "서비스 공지와 업데이트를 안내합니다."
      },
      {
        title: "Q&A",
        href: "/resources/qna",
        status: "active",
        description: "해외취업 준비 관련 질문과 답변을 정리합니다."
      },
      {
        title: "국가정보",
        href: "/resources/countries",
        status: "active",
        description: "국가별 취업 정보와 생활 정보를 제공합니다."
      },
      {
        title: "비자정보",
        href: "/resources/visas",
        status: "active",
        description: "공식 자료 링크 중심으로 비자 정보를 정리합니다."
      }
    ]
  }
];

export const menuFlow = [
  "회원가입/로그인",
  "마이페이지 프로필 입력",
  "맞춤추천 적합도 진단",
  "준비로드맵 생성",
  "AI 문서 분석과 검증 배지",
  "지원 관리와 정착 체크리스트"
];

export function statusLabel(status: MenuStatus) {
  if (status === "active") return "운영";
  if (status === "next") return "확장";
  return "예정";
}

export function statusTone(status: MenuStatus) {
  if (status === "active") return "success";
  if (status === "next") return "warning";
  return "muted";
}

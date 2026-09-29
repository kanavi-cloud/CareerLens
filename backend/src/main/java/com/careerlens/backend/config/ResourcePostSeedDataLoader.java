package com.careerlens.backend.config;

import com.careerlens.backend.entity.ResourcePost;
import com.careerlens.backend.repository.ResourcePostRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.resource-seed.enabled", havingValue = "true")
public class ResourcePostSeedDataLoader implements ApplicationRunner {

    private final ResourcePostRepository resourcePostRepository;

    public ResourcePostSeedDataLoader(ResourcePostRepository resourcePostRepository) {
        this.resourcePostRepository = resourcePostRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seed("NOTICE", "서비스", "로그인/회원가입 및 JWT 인증 구조가 dev에 반영되었습니다",
                "USER/ADMIN 권한 구분, 관리자 공고 API 보호, 로그인 실패 잠금 정책이 추가되었습니다.",
                "CareerLens 운영", "높음", "게시", true, "/resources/qna",
                tags("서비스", "JWT", "권한"),
                body(
                        "USER/ADMIN 권한 구분, 관리자 공고 API 보호, 로그인 실패 잠금 정책이 dev에 반영되었습니다.",
                        "기존 localStorage에 예전 로그인 정보가 남아 있으면 로그아웃하거나 careerlens_user 값을 삭제한 뒤 다시 로그인해주세요.",
                        "User.java, AuthService.java, auth.ts, site-header.tsx가 변경되었으니 관련 작업자는 dev 최신 내용을 먼저 pull 받아야 합니다."
                ), 152, 0);

        seed("NOTICE", "데이터", "외부 공고 API는 관리자 검수 후 DB 저장 방식으로 운영합니다",
                "Greenhouse 공개 Job Board 데이터는 미리보기 후 체크한 공고만 저장하고, 저장된 공고만 추천/로드맵 흐름에 연결합니다.",
                "CareerLens 운영", "높음", "게시", true, "/jobs/import",
                tags("공고", "Greenhouse", "관리자"),
                body(
                        "외부 공고 API는 자동 크롤링이 아니라 공개 Job Board API를 관리자 검수 후 저장하는 방식으로 운영합니다.",
                        "미리보기에서 회사, 국가, 직무군, 연봉, 비자 문구를 확인한 뒤 저장 대상만 DB에 등록합니다.",
                        "추천 진단에는 DB에 저장된 공고만 사용합니다."
                ), 135, 1);

        seed("NOTICE", "시연", "추천 진단은 마이페이지 프로필 입력을 기준으로 실행합니다",
                "사용자는 회원가입 후 마이페이지에서 희망 국가, 직무군, 기술, 언어, 우선순위를 입력해야 합니다.",
                "CareerLens 운영", "보통", "게시", false, "/mypage",
                tags("마이페이지", "추천진단"),
                body(
                        "추천 진단은 사용자가 입력한 해외취업 프로필을 기준으로 실행됩니다.",
                        "희망 국가, 직무군, 기술스택, 언어 수준, 경력, 우선순위가 추천 결과에 반영됩니다.",
                        "발표 시 회원가입 후 프로필 입력, 추천 진단, 플래너 생성 순서로 시연하면 흐름이 가장 명확합니다."
                ), 101, 2);

        seed("NOTICE", "정책", "비자 정보는 공식 링크 우선 확인 원칙으로 표시합니다",
                "CareerLens는 비자 가능 여부를 판정하지 않고, 공고의 sponsorship 문구와 공식 기관 확인 링크를 연결합니다.",
                "CareerLens 운영", "보통", "게시", false, "/resources/visas",
                tags("비자", "정책", "공식출처"),
                body(
                        "자료실의 비자정보는 법률 판단이 아니라 공식 링크와 준비 체크리스트를 제공하는 참고 자료입니다.",
                        "실제 비자 가능 여부와 제출 서류는 반드시 공식 기관, 고용주, 전문가를 통해 확인해야 합니다."
                ), 89, 3);

        seed("QNA", "데이터 정책", "CareerLens는 실제 채용공고를 자동으로 크롤링하나요?",
                "현재 프로토타입은 무단 크롤링을 하지 않습니다. 수동 조사 데이터와 공개 Job Board API를 관리자 검수 후 DB에 저장하는 방식입니다.",
                "CareerLens 팀", "참고", "답변완료", true, "/jobs/import",
                tags("데이터 정책", "외부 API"),
                body(
                        "현재 프로토타입은 무단 크롤링을 하지 않습니다.",
                        "수동 조사 데이터와 공개 Job Board API를 관리자 검수 후 DB에 저장하는 방식입니다.",
                        "자동 수집보다 데이터 출처와 정규화 기준을 설명 가능하게 유지하는 것이 우선입니다."
                ), 98, 4);

        seed("QNA", "추천 진단", "추천 점수는 AI가 직접 계산하나요?",
                "핵심 점수 계산은 공고, 사용자 프로필, PatternProfile의 정형 데이터를 기반으로 수행합니다.",
                "CareerLens 팀", "참고", "답변완료", true, "/jobs/recommendation",
                tags("추천 진단", "AI 활용"),
                body(
                        "핵심 점수 계산은 공고, 사용자 프로필, PatternProfile의 정형 데이터를 기반으로 수행합니다.",
                        "AI는 추천 이유, 부족 요소 요약, 커리어 로드맵 과제 생성처럼 설명과 실행 계획을 만드는 보조 역할로 사용합니다."
                ), 89, 5);

        seed("QNA", "PatternProfile", "PatternProfile은 무엇인가요?",
                "PatternProfile은 공고와 직원 표본, 가상 합격자 데이터를 압축한 직무 기준 프로필입니다.",
                "CareerLens 팀", "참고", "답변완료", false, "/jobs/recommendation",
                tags("PatternProfile", "추천 알고리즘"),
                body(
                        "PatternProfile은 공고와 직원 표본, 가상 합격자 데이터를 압축한 직무 기준 프로필입니다.",
                        "사용자를 공고와 1:1로만 비교하지 않고, 해당 공고에서 기대되는 역량 패턴과 비교하기 위해 사용합니다."
                ), 80, 6);

        seed("QNA", "비자", "비자 정보는 법률 자문인가요?",
                "아닙니다. 자료실의 비자 정보는 준비 체크리스트와 공식 기관 링크를 연결하는 참고 정보입니다.",
                "CareerLens 팀", "참고", "답변완료", false, "/resources/visas",
                tags("비자", "정책"),
                body(
                        "아닙니다. 자료실의 비자 정보는 준비 체크리스트와 공식 기관 링크를 연결하는 참고 정보입니다.",
                        "실제 비자 가능 여부와 제출 서류는 반드시 공식 기관, 고용주, 전문가를 통해 확인해야 합니다."
                ), 71, 7);

        seed("COUNTRY", "미국", "미국 해외취업 준비 포인트",
                "미국은 sponsorship, work authorization, location eligibility 확인이 핵심입니다.",
                "CareerLens 자료실", "참고", "게시", false, "/resources/countries",
                tags("미국", "국가정보", "비자"),
                body(
                        "미국 IT 공고는 직무 역량뿐 아니라 sponsorship, work authorization, location eligibility 문구를 함께 확인해야 합니다.",
                        "영문 이력서, GitHub, 프로젝트 근거, 시스템 설계 경험을 정리하면 추천 진단 이후 플래너 과제로 연결하기 좋습니다."
                ), 64, 8);

        seed("COUNTRY", "일본", "일본 해외취업 준비 포인트",
                "일본은 재류자격, 학력/전공/경력 증빙, 일본어 수준과 회사 제출 서류 흐름이 중요합니다.",
                "CareerLens 자료실", "참고", "게시", false, "/resources/countries",
                tags("일본", "국가정보", "재류자격"),
                body(
                        "일본 IT 직무는 기술·인문지식·국제업무 또는 고도전문직 검토가 자주 연결됩니다.",
                        "학력/전공/경력 증빙과 일본어 수준을 정리하고, 회사가 요구하는 제출 서류와 입사 일정을 확인해야 합니다."
                ), 58, 9);

        seed("VISA", "미국", "미국 고용 기반 비자 확인 체크리스트",
                "CareerLens는 비자 가능 여부를 판정하지 않고 공식 기관 확인 링크와 준비 체크리스트로 연결합니다.",
                "CareerLens 자료실", "참고", "게시", false, "/resources/visas",
                tags("미국", "비자", "sponsorship"),
                body(
                        "공고 본문에서 visa sponsorship 또는 work authorization 문구를 확인합니다.",
                        "고용주가 petition을 진행하는지 채용 담당자에게 확인하고, USCIS와 Department of State 공식 자료로 최종 확인합니다."
                ), 73, 10);

        seed("VISA", "일본", "일본 재류자격 확인 체크리스트",
                "일본 취업은 공고 직무와 재류자격 활동 범위가 맞는지 확인해야 합니다.",
                "CareerLens 자료실", "참고", "게시", false, "/resources/visas",
                tags("일본", "비자", "재류자격"),
                body(
                        "공고 직무와 재류자격 활동 범위가 맞는지 확인합니다.",
                        "학위, 전공, 경력 증빙을 일본어 또는 영문으로 정리하고, 입국 후 주소 등록과 건강보험 준비까지 행정로드맵으로 연결합니다."
                ), 69, 11);
    }

    private void seed(
            String type,
            String category,
            String title,
            String summary,
            String author,
            String priority,
            String status,
            boolean pinned,
            String relatedHref,
            List<String> tags,
            List<String> body,
            int views,
            int dayOffset
    ) {
        if (resourcePostRepository.existsByTypeAndTitle(type, title)) {
            return;
        }
        LocalDateTime now = LocalDateTime.now().minusDays(dayOffset);
        ResourcePost post = new ResourcePost();
        post.setType(type);
        post.setCategory(category);
        post.setTitle(title);
        post.setSummary(summary);
        post.setAuthor(author);
        post.setPriority(priority);
        post.setStatus(status);
        post.setPinned(pinned);
        post.setRelatedHref(relatedHref);
        post.setViewCount(views);
        post.setTags(tags);
        post.setContent(String.join("\n---\n", body));
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        resourcePostRepository.save(post);
    }

    private List<String> tags(String... values) {
        List<String> result = new ArrayList<>();
        for (String value : values) {
            result.add(value);
        }
        return result;
    }

    private List<String> body(String... values) {
        return tags(values);
    }
}

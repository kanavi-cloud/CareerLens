package com.careerlens.backend.service;

import com.careerlens.backend.dto.ResourcePostDto;
import com.careerlens.backend.dto.ResourcePostRequestDto;
import com.careerlens.backend.dto.ResourceQuestionRequestDto;
import com.careerlens.backend.entity.ResourcePost;
import com.careerlens.backend.repository.ResourcePostRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResourcePostService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");
    private static final String PARAGRAPH_DELIMITER = "\n---\n";

    private final ResourcePostRepository resourcePostRepository;

    public ResourcePostService(ResourcePostRepository resourcePostRepository) {
        this.resourcePostRepository = resourcePostRepository;
    }

    @Transactional(readOnly = true)
    public List<ResourcePostDto> getPosts(String type) {
        List<ResourcePost> posts = blank(type)
                ? resourcePostRepository.findAll()
                : resourcePostRepository.findByTypeIgnoreCaseOrderByPinnedDescCreatedAtDescIdDesc(type);
        return posts.stream()
                .map(this::toDto)
                .collect(Collectors.toCollection(ArrayList::new));
    }

    @Transactional(readOnly = true)
    public ResourcePostDto getPost(Long id) {
        return resourcePostRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    }

    @Transactional
    public ResourcePostDto createPost(ResourcePostRequestDto request) {
        ResourcePost post = new ResourcePost();
        applyRequest(post, request);
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        return toDto(resourcePostRepository.save(post));
    }

    @Transactional
    public ResourcePostDto createQuestion(ResourceQuestionRequestDto request) {
        ResourcePost post = new ResourcePost();
        LocalDateTime now = LocalDateTime.now();
        post.setType("QNA");
        post.setCategory(firstPresent(request.category(), "사용자 질문"));
        post.setTitle(request.title().trim());
        post.setSummary(request.content().trim());
        post.setContent(request.content().trim());
        post.setAuthor(firstPresent(request.author(), "익명 사용자"));
        post.setPriority("참고");
        post.setStatus("답변대기");
        post.setPinned(false);
        post.setViewCount(0);
        post.setRelatedHref("/resources/qna");
        post.setTags(mutableList(request.tags()));
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        return toDto(resourcePostRepository.save(post));
    }

    @Transactional
    public ResourcePostDto updatePost(Long id, ResourcePostRequestDto request) {
        ResourcePost post = resourcePostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        applyRequest(post, request);
        post.setUpdatedAt(LocalDateTime.now());
        return toDto(post);
    }

    @Transactional
    public void deletePost(Long id) {
        resourcePostRepository.deleteById(id);
    }

    public ResourcePostDto toDto(ResourcePost post) {
        return new ResourcePostDto(
                post.getId(),
                post.getType(),
                post.getCategory(),
                post.getTitle(),
                post.getCreatedAt() == null ? "" : post.getCreatedAt().format(DATE_FORMATTER),
                post.getSummary(),
                splitBody(post.getContent()),
                post.getAuthor(),
                post.getViewCount() == null ? 0 : post.getViewCount(),
                post.getPriority(),
                post.getStatus(),
                Boolean.TRUE.equals(post.getPinned()),
                mutableList(post.getTags()),
                post.getRelatedHref()
        );
    }

    private void applyRequest(ResourcePost post, ResourcePostRequestDto request) {
        post.setType(normalizeType(request.type()));
        post.setCategory(request.category().trim());
        post.setTitle(request.title().trim());
        post.setSummary(blankToNull(request.summary()));
        post.setContent(joinBody(request.body()));
        post.setAuthor(firstPresent(request.author(), "CareerLens 운영"));
        post.setPriority(blankToNull(request.priority()));
        post.setStatus(blankToNull(request.status()));
        post.setPinned(Boolean.TRUE.equals(request.pinned()));
        post.setViewCount(request.views() == null ? 0 : Math.max(0, request.views()));
        post.setRelatedHref(blankToNull(request.relatedHref()));
        post.setTags(mutableList(request.tags()));
    }

    private String normalizeType(String type) {
        return type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
    }

    private List<String> splitBody(String content) {
        List<String> result = new ArrayList<>();
        if (blank(content)) {
            return result;
        }
        String[] parts = content.split(PARAGRAPH_DELIMITER);
        for (String part : parts) {
            if (!part.isBlank()) {
                result.add(part.trim());
            }
        }
        return result;
    }

    private String joinBody(List<String> body) {
        if (body == null || body.isEmpty()) {
            return "";
        }
        return body.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(PARAGRAPH_DELIMITER));
    }

    private List<String> mutableList(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }

    private String firstPresent(String value, String fallback) {
        return blank(value) ? fallback : value.trim();
    }

    private String blankToNull(String value) {
        return blank(value) ? null : value.trim();
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }
}

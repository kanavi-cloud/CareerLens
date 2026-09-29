package com.careerlens.backend.controller;

import com.careerlens.backend.dto.ResourcePostDto;
import com.careerlens.backend.dto.ResourcePostRequestDto;
import com.careerlens.backend.dto.ResourceQuestionRequestDto;
import com.careerlens.backend.service.ResourcePostService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/resources/posts")
public class ResourcePostController {

    private final ResourcePostService resourcePostService;

    public ResourcePostController(ResourcePostService resourcePostService) {
        this.resourcePostService = resourcePostService;
    }

    @GetMapping
    public List<ResourcePostDto> getPosts(@RequestParam(required = false) String type) {
        return resourcePostService.getPosts(type);
    }

    @GetMapping("/{id}")
    public ResourcePostDto getPost(@PathVariable Long id) {
        return resourcePostService.getPost(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResourcePostDto createPost(@Valid @RequestBody ResourcePostRequestDto request) {
        return resourcePostService.createPost(request);
    }

    @PostMapping("/qna/questions")
    public ResourcePostDto createQuestion(@Valid @RequestBody ResourceQuestionRequestDto request) {
        return resourcePostService.createQuestion(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourcePostDto updatePost(@PathVariable Long id, @Valid @RequestBody ResourcePostRequestDto request) {
        return resourcePostService.updatePost(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePost(@PathVariable Long id) {
        resourcePostService.deletePost(id);
    }
}

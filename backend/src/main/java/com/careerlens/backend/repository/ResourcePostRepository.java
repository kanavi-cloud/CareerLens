package com.careerlens.backend.repository;

import com.careerlens.backend.entity.ResourcePost;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResourcePostRepository extends JpaRepository<ResourcePost, Long> {

    List<ResourcePost> findByTypeIgnoreCaseOrderByPinnedDescCreatedAtDescIdDesc(String type);

    boolean existsByTypeAndTitle(String type, String title);
}

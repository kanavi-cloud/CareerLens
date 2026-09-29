package com.careerlens.backend.repository;

import com.careerlens.backend.entity.DepartureFlightOffer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartureFlightOfferRepository extends JpaRepository<DepartureFlightOffer, Long> {

    List<DepartureFlightOffer> findByDepartureRoadmapIdOrderBySortOrderAsc(Long departureRoadmapId);

    void deleteByDepartureRoadmapId(Long departureRoadmapId);
}

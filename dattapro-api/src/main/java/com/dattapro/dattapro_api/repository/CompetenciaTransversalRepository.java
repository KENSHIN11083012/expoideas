package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.CompetenciaTransversal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompetenciaTransversalRepository extends JpaRepository<CompetenciaTransversal, Integer> {
}

package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.CompetenciaTecnica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CompetenciaTecnicaRepository extends JpaRepository<CompetenciaTecnica, Integer> {
}

package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.CentroInvestigativo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CentroInvestigativoRepository extends JpaRepository<CentroInvestigativo, Integer> {
}

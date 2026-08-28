package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.ConvocatoriaLineaInvestigacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConvocatoriaLineaInvestigacionRepository extends JpaRepository<ConvocatoriaLineaInvestigacion, Integer> {
    
    @Query("SELECT DISTINCT l.linea FROM ConvocatoriaLineaInvestigacion l")
    List<String> findUniqueLineas();
}

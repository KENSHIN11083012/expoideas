package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.AreaEspecialidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaEspecialidadRepository extends JpaRepository<AreaEspecialidad, Integer> {
}

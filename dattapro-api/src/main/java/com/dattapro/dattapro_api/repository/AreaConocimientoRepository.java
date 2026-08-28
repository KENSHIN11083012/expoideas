package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.AreaConocimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AreaConocimientoRepository extends JpaRepository<AreaConocimiento, Integer> {
}

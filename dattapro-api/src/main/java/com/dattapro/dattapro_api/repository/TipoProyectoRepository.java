package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.TipoProyecto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoProyectoRepository extends JpaRepository<TipoProyecto, Integer> {
}

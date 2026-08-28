package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.TipoServicio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TipoServicioRepository extends JpaRepository<TipoServicio, Integer> {
}

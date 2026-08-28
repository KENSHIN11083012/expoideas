package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.Entidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntidadRepository extends JpaRepository<Entidad, Integer> {
}

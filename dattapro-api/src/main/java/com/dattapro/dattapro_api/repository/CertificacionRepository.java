package com.dattapro.dattapro_api.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.dattapro.dattapro_api.entity.Certificacion;

public interface CertificacionRepository extends JpaRepository<Certificacion, Integer> {
    Optional<Certificacion> findByNombre(String nombre);
    Optional<Certificacion> findByNombreIgnoreCase(String nombre);
}

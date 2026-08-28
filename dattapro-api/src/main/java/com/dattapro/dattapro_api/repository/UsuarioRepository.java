package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de Usuario.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    boolean existsByCorreoInstitucional(String correoInstitucional);

    Optional<Usuario> findByCorreoInstitucional(String correoInstitucional);

    /**
     * Carga un usuario con sede, programa y facultad ya resueltos.
     * Sin el fetch join, construir el UsuarioResponseDTO dispara tres consultas
     * extra por usuario.
     */
    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.sede " +
           "LEFT JOIN FETCH u.programaAcademico p " +
           "LEFT JOIN FETCH p.facultad " +
           "WHERE u.id = :id")
    Optional<Usuario> findByIdWithBaseInfo(@Param("id") Integer id);

    /**
     * Versión de listado del fetch join anterior: evita el N+1 al mapear
     * la lista completa de usuarios a DTOs.
     */
    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.sede " +
           "LEFT JOIN FETCH u.programaAcademico p " +
           "LEFT JOIN FETCH p.facultad")
    List<Usuario> findAllWithBaseInfo();
}

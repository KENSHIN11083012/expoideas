package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/**
 * Repositorio JPA para la entidad Usuario.
 * Extiende JpaRepository para operaciones CRUD estándar.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    /**
     * Verifica si ya existe un usuario con el correo institucional dado.
     * 
     * @param correoInstitucional correo a verificar
     * @return true si el correo ya está registrado
     */
    boolean existsByCorreoInstitucional(String correoInstitucional);

    /**
     * Busca un usuario por su correo institucional.
     * 
     * @param correoInstitucional correo del usuario
     * @return Optional con el usuario si existe
     */
    Optional<Usuario> findByCorreoInstitucional(String correoInstitucional);

    /**
     * Busca un usuario por ID cargando todas las relaciones @ManyToOne de base para evitar N+1.
     */
    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.tipoDocumento " +
           "LEFT JOIN FETCH u.tipoVinculacion " +
           "LEFT JOIN FETCH u.sede " +
           "LEFT JOIN FETCH u.centroInvestigativo " +
           "LEFT JOIN FETCH u.programaAcademico p " +
           "LEFT JOIN FETCH p.facultad " +
           "WHERE u.id = :id")
    Optional<Usuario> findByIdWithBaseInfo(@Param("id") Integer id);
}
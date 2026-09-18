package co.edu.unisimon.expoideas.repository;

import co.edu.unisimon.expoideas.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA de Usuario.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Integer> {

    boolean existsByCorreoInstitucional(String correoInstitucional);

    Optional<Usuario> findByCorreoInstitucional(String correoInstitucional);

    /**
     * Carga un usuario con sede, programa, facultad y foto ya resueltos.
     * Sin el fetch join, construir el UsuarioResponseDTO dispara varias consultas
     * extra por usuario.
     */
    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.sede " +
           "LEFT JOIN FETCH u.facultad " +
           "LEFT JOIN FETCH u.programaAcademico p " +
           "LEFT JOIN FETCH p.facultad " +
           "LEFT JOIN FETCH u.foto " +
           "WHERE u.id = :id")
    Optional<Usuario> findByIdWithBaseInfo(@Param("id") Integer id);

    /** Igual que {@link #findByIdWithBaseInfo}, buscando por el correo de la sesión. */
    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.sede " +
           "LEFT JOIN FETCH u.facultad " +
           "LEFT JOIN FETCH u.programaAcademico p " +
           "LEFT JOIN FETCH p.facultad " +
           "LEFT JOIN FETCH u.foto " +
           "WHERE u.correoInstitucional = :correo")
    Optional<Usuario> findByCorreoWithBaseInfo(@Param("correo") String correo);

    /**
     * Versión de listado del fetch join anterior: evita el N+1 al mapear
     * la lista completa de usuarios a DTOs.
     */
    @Query("SELECT u FROM Usuario u " +
           "LEFT JOIN FETCH u.sede " +
           "LEFT JOIN FETCH u.facultad " +
           "LEFT JOIN FETCH u.programaAcademico p " +
           "LEFT JOIN FETCH p.facultad " +
           "LEFT JOIN FETCH u.foto")
    List<Usuario> findAllWithBaseInfo();
}

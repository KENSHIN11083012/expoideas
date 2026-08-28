package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.Convocatoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConvocatoriaRepository extends JpaRepository<Convocatoria, Integer> {

    /**
     * Obtiene todas las convocatorias con sus relaciones base cargadas
     * (categoria y entidad) para evitar N+1.
     */
    @Query("SELECT c FROM Convocatoria c " +
           "LEFT JOIN FETCH c.categoria " +
           "LEFT JOIN FETCH c.entidad " +
           "LEFT JOIN FETCH c.usuario")
    List<Convocatoria> findAllWithBaseInfo();

    /**
     * Obtiene una convocatoria con sus relaciones base por ID.
     */
    @Query("SELECT c FROM Convocatoria c " +
           "LEFT JOIN FETCH c.categoria " +
           "LEFT JOIN FETCH c.entidad " +
           "LEFT JOIN FETCH c.usuario " +
           "WHERE c.id = ?1")
    Optional<Convocatoria> findByIdWithBaseInfo(Integer id);

    /**
     * Filtra convocatorias por categoría.
     */
    @Query("SELECT c FROM Convocatoria c " +
           "LEFT JOIN FETCH c.categoria " +
           "LEFT JOIN FETCH c.entidad " +
           "LEFT JOIN FETCH c.usuario " +
           "WHERE c.categoria.id = ?1")
    List<Convocatoria> findByCategoriaId(Integer categoriaId);

    /**
     * Filtra convocatorias por usuario creador.
     */
    @Query("SELECT c FROM Convocatoria c " +
           "LEFT JOIN FETCH c.categoria " +
           "LEFT JOIN FETCH c.entidad " +
           "LEFT JOIN FETCH c.usuario " +
           "WHERE c.usuario.id = ?1")
    List<Convocatoria> findByUsuarioId(Integer usuarioId);
}

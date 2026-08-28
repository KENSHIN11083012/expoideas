package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.Convocatoria;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

/**
 * Repositorio de queries nativas para las tablas puente de convocatorias.
 * Sigue el mismo patrón que UsuarioPerfilRelacionesRepository.
 */
public interface ConvocatoriaRelacionesRepository extends Repository<Convocatoria, Integer> {

    // ===========================
    // DELETE queries (tablas puente)
    // ===========================

    @Modifying
    @Query(value = "DELETE FROM convocatoria_area WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaAreas(Integer convocatoriaId);

    @Modifying
    @Query(value = "DELETE FROM convocatoria_area_especialidad WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaAreasEspecialidad(Integer convocatoriaId);

    @Modifying
    @Query(value = "DELETE FROM convocatoria_competencias_tecnicas WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaCompetenciasTecnicas(Integer convocatoriaId);

    @Modifying
    @Query(value = "DELETE FROM convocatoria_competencias_transversales WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaCompetenciasTransversales(Integer convocatoriaId);

    @Modifying
    @Query(value = "DELETE FROM convocatoria_sector WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaSectores(Integer convocatoriaId);

    @Modifying
    @Query(value = "DELETE FROM convocatoria_servicios WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaServicios(Integer convocatoriaId);

    @Modifying
    @Query(value = "DELETE FROM convocatoria_tipos_proyecto WHERE convocatoria_id = ?1", nativeQuery = true)
    void deleteConvocatoriaTiposProyecto(Integer convocatoriaId);

    // ===========================
    // INSERT queries (tablas puente)
    // ===========================

    @Modifying
    @Query(value = "INSERT INTO convocatoria_area (convocatoria_id, area_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaArea(Integer convocatoriaId, Integer areaId);

    @Modifying
    @Query(value = "INSERT INTO convocatoria_area_especialidad (convocatoria_id, area_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaAreaEspecialidad(Integer convocatoriaId, Integer areaId);

    @Modifying
    @Query(value = "INSERT INTO convocatoria_competencias_tecnicas (convocatoria_id, competencia_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaCompetenciaTecnica(Integer convocatoriaId, Integer competenciaId);

    @Modifying
    @Query(value = "INSERT INTO convocatoria_competencias_transversales (convocatoria_id, competencia_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaCompetenciaTransversal(Integer convocatoriaId, Integer competenciaId);

    @Modifying
    @Query(value = "INSERT INTO convocatoria_sector (convocatoria_id, sector_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaSector(Integer convocatoriaId, Integer sectorId);

    @Modifying
    @Query(value = "INSERT INTO convocatoria_servicios (convocatoria_id, servicio_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaServicio(Integer convocatoriaId, Integer servicioId);

    @Modifying
    @Query(value = "INSERT INTO convocatoria_tipos_proyecto (convocatoria_id, tipo_proyecto_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertConvocatoriaTipoProyecto(Integer convocatoriaId, Integer tipoProyectoId);
}

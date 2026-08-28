package com.dattapro.dattapro_api.repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import com.dattapro.dattapro_api.entity.Usuario;

public interface UsuarioPerfilRelacionesRepository extends Repository<Usuario, Integer> {

    // DELETE queries
    @Modifying
    @Query(value = "DELETE FROM usuario_area WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioArea(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_certificaciones WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioCertificaciones(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_idiomas WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioIdiomas(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_proyectos WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioProyectos(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_competencias_tecnicas WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioCompetenciasTecnicas(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_competencias_transversales WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioCompetenciasTransversales(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_servicios WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioServicios(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_sectores_experiencia WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioSectoresExperiencia(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuarios_intereses_red WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuariosInteresesRed(Integer usuarioId);

    @Modifying
    @Query(value = "DELETE FROM usuario_areas_especialidad WHERE usuario_id = ?1", nativeQuery = true)
    void deleteUsuarioAreaEspecialidad(Integer usuarioId);

    // INSERT queries
    @Modifying
    @Query(value = "INSERT INTO usuario_area (usuario_id, area_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioArea(Integer usuarioId, Integer areaId);

    @Modifying
    @Query(value = "INSERT INTO usuario_certificaciones (usuario_id, certificacion_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioCertificacion(Integer usuarioId, Integer certificacionId);

    @Modifying
    @Query(value = "INSERT INTO usuario_idiomas (usuario_id, idioma_id, nivel_id) VALUES (?1, ?2, ?3)", nativeQuery = true)
    void insertUsuarioIdioma(Integer usuarioId, Integer idiomaId, Integer nivelId);

    @Modifying
    @Query(value = "INSERT INTO usuario_proyectos (usuario_id, proyecto_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioProyecto(Integer usuarioId, Integer proyectoId);

    @Modifying
    @Query(value = "INSERT INTO usuario_competencias_tecnicas (usuario_id, competencia_id, nivel) VALUES (?1, ?2, ?3)", nativeQuery = true)
    void insertUsuarioCompetenciaTecnica(Integer usuarioId, Integer competenciaId, Integer nivel);

    @Modifying
    @Query(value = "INSERT INTO usuario_competencias_transversales (usuario_id, competencia_id, nivel) VALUES (?1, ?2, ?3)", nativeQuery = true)
    void insertUsuarioCompetenciaTransversal(Integer usuarioId, Integer competenciaId, Integer nivel);

    @Modifying
    @Query(value = "DELETE FROM usuario_formacion WHERE id_usuario = ?1", nativeQuery = true)
    void deleteUsuarioFormacion(Integer usuarioId);

    @Modifying
    @Query(value = "INSERT INTO usuario_formacion (id_usuario, id_nivel_formacion, titulo) VALUES (?1, ?2, ?3)", nativeQuery = true)
    void insertUsuarioFormacion(Integer usuarioId, Integer nivelFormacionId, String titulo);

    @Modifying
    @Query(value = "INSERT INTO usuario_servicios (usuario_id, servicio_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioServicio(Integer usuarioId, Integer servicioId);

    @Modifying
    @Query(value = "INSERT INTO usuario_sectores_experiencia (usuario_id, sector_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioSectorExperiencia(Integer usuarioId, Integer sectorId);

    @Modifying
    @Query(value = "INSERT INTO usuarios_intereses_red (usuario_id, interes_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioInteresRed(Integer usuarioId, Integer interesId);

    @Modifying
    @Query(value = "INSERT INTO usuario_areas_especialidad (usuario_id, area_id) VALUES (?1, ?2)", nativeQuery = true)
    void insertUsuarioAreaEspecialidad(Integer usuarioId, Integer areaId);
}

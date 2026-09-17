package co.edu.unisimon.expoideas.repository;

import co.edu.unisimon.expoideas.entity.ProgramaAcademico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgramaAcademicoRepository extends JpaRepository<ProgramaAcademico, Integer> {

    /** Listado con la facultad resuelta: evita una consulta por programa al mapear a DTO. */
    @Query("SELECT p FROM ProgramaAcademico p JOIN FETCH p.facultad")
    List<ProgramaAcademico> findAllWithFacultad();
}

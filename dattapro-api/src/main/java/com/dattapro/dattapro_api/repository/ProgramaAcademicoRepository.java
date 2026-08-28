package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.ProgramaAcademico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProgramaAcademicoRepository extends JpaRepository<ProgramaAcademico, Integer> {
}

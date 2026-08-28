package com.dattapro.dattapro_api.repository;

import com.dattapro.dattapro_api.entity.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Integer> {
    Optional<Keyword> findByNombreIgnoreCase(String nombre);
}

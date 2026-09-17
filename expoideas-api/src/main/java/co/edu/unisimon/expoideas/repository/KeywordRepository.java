package co.edu.unisimon.expoideas.repository;

import co.edu.unisimon.expoideas.entity.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Integer> {
    Optional<Keyword> findByNombreIgnoreCase(String nombre);
}

package co.edu.unisimon.expoideas.repository;

import co.edu.unisimon.expoideas.entity.Facultad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FacultadRepository extends JpaRepository<Facultad, Integer> {
}

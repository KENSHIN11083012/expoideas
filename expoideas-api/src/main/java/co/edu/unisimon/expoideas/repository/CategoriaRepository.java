package co.edu.unisimon.expoideas.repository;

import co.edu.unisimon.expoideas.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
}

package co.edu.unisimon.expoideas.repository;

import co.edu.unisimon.expoideas.entity.Archivo;
import co.edu.unisimon.expoideas.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArchivoRepository extends JpaRepository<Archivo, Integer> {

    /** Con el propietario cargado: la descarga de archivos privados lo necesita para decidir. */
    @Query("SELECT a FROM Archivo a JOIN FETCH a.propietario WHERE a.uuid = :uuid")
    Optional<Archivo> findByUuid(@Param("uuid") String uuid);

    List<Archivo> findByPropietario(Usuario propietario);
}

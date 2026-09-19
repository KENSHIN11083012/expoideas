package co.edu.unisimon.expoideas.catalogs;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.NoSuchElementException;

/**
 * Busca registros de catálogo por id para otros módulos (p. ej. la adscripción de
 * una cuenta). Los ids se resuelven contra la BD en vez de crear entidades
 * sueltas: así un id inexistente falla aquí con 404 y no como violación de FK
 * al hacer flush.
 */
@Component
@RequiredArgsConstructor
public class CatalogLookup {

    private final CampusRepository campusRepository;
    private final FacultyRepository facultyRepository;
    private final AcademicProgramRepository academicProgramRepository;

    /** @throws NoSuchElementException si no existe */
    public Campus campus(Integer id) {
        return campusRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una sede con ID: " + id));
    }

    /** @throws NoSuchElementException si no existe */
    public Faculty faculty(Integer id) {
        return facultyRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una facultad con ID: " + id));
    }

    /** @throws NoSuchElementException si no existe */
    public AcademicProgram academicProgram(Integer id) {
        return academicProgramRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un programa académico con ID: " + id));
    }
}

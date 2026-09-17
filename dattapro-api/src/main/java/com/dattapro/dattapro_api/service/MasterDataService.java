package com.dattapro.dattapro_api.service;

import com.dattapro.dattapro_api.dto.CatalogoRequestDTO;
import com.dattapro.dattapro_api.dto.CatalogoResponseDTO;
import com.dattapro.dattapro_api.dto.ProgramaAcademicoRequestDTO;
import com.dattapro.dattapro_api.dto.ProgramaAcademicoResponseDTO;
import com.dattapro.dattapro_api.entity.Catalogo;
import com.dattapro.dattapro_api.entity.Categoria;
import com.dattapro.dattapro_api.entity.Facultad;
import com.dattapro.dattapro_api.entity.Keyword;
import com.dattapro.dattapro_api.entity.ProgramaAcademico;
import com.dattapro.dattapro_api.entity.Sede;
import com.dattapro.dattapro_api.repository.CategoriaRepository;
import com.dattapro.dattapro_api.repository.FacultadRepository;
import com.dattapro.dattapro_api.repository.KeywordRepository;
import com.dattapro.dattapro_api.repository.ProgramaAcademicoRepository;
import com.dattapro.dattapro_api.repository.SedeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.function.Supplier;

/**
 * CRUD de los catalogos maestros: estructura academica y clasificacion.
 *
 * <p>Sedes, facultades, categorias y keywords solo tienen nombre y comparten el
 * mismo codigo a traves de {@link Catalogo}. Programas academicos llevan
 * ademas su facultad.
 *
 * <p>Un nombre repetido en categorias o keywords (columna unica) sale como
 * DataIntegrityViolationException, que GlobalExceptionHandler responde con 409.
 */
@Service
@RequiredArgsConstructor
public class MasterDataService {

    private final SedeRepository sedeRepository;
    private final FacultadRepository facultadRepository;
    private final ProgramaAcademicoRepository programaAcademicoRepository;
    private final CategoriaRepository categoriaRepository;
    private final KeywordRepository keywordRepository;

    // ---------------------------------------------
    // SEDE
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<CatalogoResponseDTO> listarSedes() {
        return listar(sedeRepository);
    }

    @Transactional
    public CatalogoResponseDTO crearSede(CatalogoRequestDTO dto) {
        return crear(sedeRepository, Sede::new, dto);
    }

    /** @throws NoSuchElementException si el ID no existe */
    @Transactional
    public CatalogoResponseDTO actualizarSede(Integer id, CatalogoRequestDTO dto) {
        return actualizar(sedeRepository, id, dto, "una sede");
    }

    // ---------------------------------------------
    // FACULTAD
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<CatalogoResponseDTO> listarFacultades() {
        return listar(facultadRepository);
    }

    @Transactional
    public CatalogoResponseDTO crearFacultad(CatalogoRequestDTO dto) {
        return crear(facultadRepository, Facultad::new, dto);
    }

    /** @throws NoSuchElementException si el ID no existe */
    @Transactional
    public CatalogoResponseDTO actualizarFacultad(Integer id, CatalogoRequestDTO dto) {
        return actualizar(facultadRepository, id, dto, "una facultad");
    }

    // ---------------------------------------------
    // PROGRAMA ACADEMICO
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<ProgramaAcademicoResponseDTO> listarProgramasAcademicos() {
        return programaAcademicoRepository.findAllWithFacultad().stream()
                .map(ProgramaAcademicoResponseDTO::from)
                .toList();
    }

    /** @throws NoSuchElementException si la facultad no existe */
    @Transactional
    public ProgramaAcademicoResponseDTO crearProgramaAcademico(ProgramaAcademicoRequestDTO dto) {
        ProgramaAcademico programa = new ProgramaAcademico();
        programa.setNombre(dto.nombre().trim());
        programa.setFacultad(buscarFacultad(dto.facultadId()));
        return ProgramaAcademicoResponseDTO.from(programaAcademicoRepository.save(programa));
    }

    /** @throws NoSuchElementException si el programa o la facultad no existen */
    @Transactional
    public ProgramaAcademicoResponseDTO actualizarProgramaAcademico(Integer id, ProgramaAcademicoRequestDTO dto) {
        ProgramaAcademico programa = programaAcademicoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un programa academico con ID: " + id));
        programa.setNombre(dto.nombre().trim());
        programa.setFacultad(buscarFacultad(dto.facultadId()));
        return ProgramaAcademicoResponseDTO.from(programaAcademicoRepository.save(programa));
    }

    private Facultad buscarFacultad(Integer facultadId) {
        return facultadRepository.findById(facultadId)
                .orElseThrow(() -> new NoSuchElementException("No existe una facultad con ID: " + facultadId));
    }

    // ---------------------------------------------
    // CATEGORIA
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<CatalogoResponseDTO> listarCategorias() {
        return listar(categoriaRepository);
    }

    @Transactional
    public CatalogoResponseDTO crearCategoria(CatalogoRequestDTO dto) {
        return crear(categoriaRepository, Categoria::new, dto);
    }

    /** @throws NoSuchElementException si el ID no existe */
    @Transactional
    public CatalogoResponseDTO actualizarCategoria(Integer id, CatalogoRequestDTO dto) {
        return actualizar(categoriaRepository, id, dto, "una categoria");
    }

    // ---------------------------------------------
    // KEYWORD
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<CatalogoResponseDTO> listarKeywords() {
        return listar(keywordRepository);
    }

    @Transactional
    public CatalogoResponseDTO crearKeyword(CatalogoRequestDTO dto) {
        return crear(keywordRepository, Keyword::new, dto);
    }

    /** @throws NoSuchElementException si el ID no existe */
    @Transactional
    public CatalogoResponseDTO actualizarKeyword(Integer id, CatalogoRequestDTO dto) {
        return actualizar(keywordRepository, id, dto, "una keyword");
    }

    // ---------------------------------------------
    // Comun a los catalogos que solo tienen nombre
    // ---------------------------------------------

    private <T extends Catalogo> List<CatalogoResponseDTO> listar(JpaRepository<T, Integer> repository) {
        return repository.findAll().stream()
                .map(CatalogoResponseDTO::from)
                .toList();
    }

    private <T extends Catalogo> CatalogoResponseDTO crear(
            JpaRepository<T, Integer> repository, Supplier<T> nuevo, CatalogoRequestDTO dto) {
        T registro = nuevo.get();
        registro.setNombre(dto.nombre().trim());
        // saveAndFlush: si el nombre choca con una columna unica, falla aqui como
        // DataIntegrityViolationException (409) y no al hacer commit, donde puede
        // llegar envuelta en una TransactionSystemException (500).
        return CatalogoResponseDTO.from(repository.saveAndFlush(registro));
    }

    private <T extends Catalogo> CatalogoResponseDTO actualizar(
            JpaRepository<T, Integer> repository, Integer id, CatalogoRequestDTO dto, String descripcion) {
        T registro = repository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe " + descripcion + " con ID: " + id));
        registro.setNombre(dto.nombre().trim());
        return CatalogoResponseDTO.from(repository.saveAndFlush(registro));
    }
}

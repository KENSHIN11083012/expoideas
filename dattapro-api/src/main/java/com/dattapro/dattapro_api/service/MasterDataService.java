package com.dattapro.dattapro_api.service;

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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

/**
 * CRUD de los catalogos maestros: estructura academica y clasificacion.
 *
 * <p>Dattapro tenia catorce catalogos; aqui sobreviven los cinco del baseline.
 * El resto pertenecia al perfil docente y se retiro con el dominio de
 * convocatorias.
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
    public List<Sede> listarSedes() {
        return sedeRepository.findAll();
    }

    @Transactional
    public Sede crearSede(Sede sede) {
        return sedeRepository.save(sede);
    }

    /**
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional
    public Sede actualizarSede(Integer id, Sede datos) {
        Sede sede = sedeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una sede con ID: " + id));
        sede.setNombre(datos.getNombre());
        return sedeRepository.save(sede);
    }

    // ---------------------------------------------
    // FACULTAD
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<Facultad> listarFacultades() {
        return facultadRepository.findAll();
    }

    @Transactional
    public Facultad crearFacultad(Facultad facultad) {
        return facultadRepository.save(facultad);
    }

    /**
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional
    public Facultad actualizarFacultad(Integer id, Facultad datos) {
        Facultad facultad = facultadRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una facultad con ID: " + id));
        facultad.setNombre(datos.getNombre());
        return facultadRepository.save(facultad);
    }

    // ---------------------------------------------
    // PROGRAMA ACADEMICO
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<ProgramaAcademico> listarProgramasAcademicos() {
        return programaAcademicoRepository.findAll();
    }

    @Transactional
    public ProgramaAcademico crearProgramaAcademico(ProgramaAcademico programa) {
        return programaAcademicoRepository.save(programa);
    }

    /**
     * @throws NoSuchElementException si el programa o la facultad no existen
     */
    @Transactional
    public ProgramaAcademico actualizarProgramaAcademico(Integer id, ProgramaAcademico datos) {
        ProgramaAcademico programa = programaAcademicoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un programa academico con ID: " + id));
        programa.setNombre(datos.getNombre());

        if (datos.getFacultad() != null && datos.getFacultad().getId() != null) {
            Integer facultadId = datos.getFacultad().getId();
            Facultad facultad = facultadRepository.findById(facultadId)
                    .orElseThrow(() -> new NoSuchElementException("No existe una facultad con ID: " + facultadId));
            programa.setFacultad(facultad);
        }
        return programaAcademicoRepository.save(programa);
    }

    // ---------------------------------------------
    // CATEGORIA
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    @Transactional
    public Categoria crearCategoria(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    /**
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional
    public Categoria actualizarCategoria(Integer id, Categoria datos) {
        Categoria categoria = categoriaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una categoria con ID: " + id));
        categoria.setNombre(datos.getNombre());
        return categoriaRepository.save(categoria);
    }

    // ---------------------------------------------
    // KEYWORD
    // ---------------------------------------------

    @Transactional(readOnly = true)
    public List<Keyword> listarKeywords() {
        return keywordRepository.findAll();
    }

    @Transactional
    public Keyword crearKeyword(Keyword keyword) {
        return keywordRepository.save(keyword);
    }

    /**
     * @throws NoSuchElementException si el ID no existe
     */
    @Transactional
    public Keyword actualizarKeyword(Integer id, Keyword datos) {
        Keyword keyword = keywordRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe una keyword con ID: " + id));
        keyword.setNombre(datos.getNombre());
        return keywordRepository.save(keyword);
    }
}

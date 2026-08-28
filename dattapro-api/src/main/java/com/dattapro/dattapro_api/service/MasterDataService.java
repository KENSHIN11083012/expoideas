package com.dattapro.dattapro_api.service;

import com.dattapro.dattapro_api.entity.*;
import com.dattapro.dattapro_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MasterDataService {

    // ─── Repositorios existentes ───────────────────────────────────────────────
    private final AreaConocimientoRepository areaConocimientoRepository;
    private final AreaEspecialidadRepository areaEspecialidadRepository;
    private final SectorExperienciaRepository sectorExperienciaRepository;
    private final TipoServicioRepository tipoServicioRepository;
    private final TipoProyectoRepository tipoProyectoRepository;
    private final CompetenciaTecnicaRepository competenciaTecnicaRepository;
    private final CompetenciaTransversalRepository competenciaTransversalRepository;

    // ─── Repositorios nuevos ───────────────────────────────────────────────────
    private final SedeRepository sedeRepository;
    private final ProgramaAcademicoRepository programaAcademicoRepository;
    private final FacultadRepository facultadRepository;
    private final CentroInvestigativoRepository centroInvestigativoRepository;
    private final TipoVinculacionRepository tipoVinculacionRepository;
    private final IdiomaRepository idiomaRepository;
    private final InteresRedRepository interesRedRepository;

    // ═══════════════════════════════════════════════════════════════════════════
    // SEDE
    // ═══════════════════════════════════════════════════════════════════════════
    public List<Sede> listarSedes() {
        return sedeRepository.findAll();
    }

    public Sede crearSede(Sede sede) {
        return sedeRepository.save(sede);
    }

    public Sede actualizarSede(Integer id, Sede datos) {
        Sede sede = sedeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sede no encontrada: " + id));
        sede.setNombre(datos.getNombre());
        return sedeRepository.save(sede);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PROGRAMA ACADÉMICO
    // ═══════════════════════════════════════════════════════════════════════════
    public List<ProgramaAcademico> listarProgramasAcademicos() {
        return programaAcademicoRepository.findAll();
    }

    public ProgramaAcademico crearProgramaAcademico(ProgramaAcademico programa) {
        return programaAcademicoRepository.save(programa);
    }

    public ProgramaAcademico actualizarProgramaAcademico(Integer id, ProgramaAcademico datos) {
        ProgramaAcademico programa = programaAcademicoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("ProgramaAcademico no encontrado: " + id));
        programa.setNombre(datos.getNombre());
        if (datos.getFacultad() != null) {
            programa.setFacultad(datos.getFacultad());
        }
        return programaAcademicoRepository.save(programa);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FACULTAD
    // ═══════════════════════════════════════════════════════════════════════════
    public List<Facultad> listarFacultades() {
        return facultadRepository.findAll();
    }

    public Facultad crearFacultad(Facultad facultad) {
        return facultadRepository.save(facultad);
    }

    public Facultad actualizarFacultad(Integer id, Facultad datos) {
        Facultad facultad = facultadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Facultad no encontrada: " + id));
        facultad.setNombre(datos.getNombre());
        return facultadRepository.save(facultad);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CENTRO INVESTIGATIVO
    // ═══════════════════════════════════════════════════════════════════════════
    public List<CentroInvestigativo> listarCentrosInvestigativos() {
        return centroInvestigativoRepository.findAll();
    }

    public CentroInvestigativo crearCentroInvestigativo(CentroInvestigativo centro) {
        return centroInvestigativoRepository.save(centro);
    }

    public CentroInvestigativo actualizarCentroInvestigativo(Integer id, CentroInvestigativo datos) {
        CentroInvestigativo centro = centroInvestigativoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CentroInvestigativo no encontrado: " + id));
        centro.setNombre(datos.getNombre());
        centro.setSubtitulo(datos.getSubtitulo());
        return centroInvestigativoRepository.save(centro);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPO VINCULACIÓN
    // ═══════════════════════════════════════════════════════════════════════════
    public List<TipoVinculacion> listarTiposVinculacion() {
        return tipoVinculacionRepository.findAll();
    }

    public TipoVinculacion crearTipoVinculacion(TipoVinculacion tipoVinculacion) {
        return tipoVinculacionRepository.save(tipoVinculacion);
    }

    public TipoVinculacion actualizarTipoVinculacion(Integer id, TipoVinculacion datos) {
        TipoVinculacion tv = tipoVinculacionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TipoVinculacion no encontrado: " + id));
        tv.setNombre(datos.getNombre());
        return tipoVinculacionRepository.save(tv);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // IDIOMAS
    // ═══════════════════════════════════════════════════════════════════════════
    public List<Idioma> listarIdiomas() {
        return idiomaRepository.findAll();
    }

    public Idioma crearIdioma(Idioma idioma) {
        return idiomaRepository.save(idioma);
    }

    public Idioma actualizarIdioma(Integer id, Idioma datos) {
        Idioma idioma = idiomaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Idioma no encontrado: " + id));
        idioma.setNombre(datos.getNombre());
        return idiomaRepository.save(idioma);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTORES DE EXPERIENCIA (servicios en DTO)
    // ═══════════════════════════════════════════════════════════════════════════
    public List<SectorExperiencia> listarSectoresExperiencia() {
        return sectorExperienciaRepository.findAll();
    }

    public SectorExperiencia crearSectorExperiencia(SectorExperiencia sector) {
        return sectorExperienciaRepository.save(sector);
    }

    public SectorExperiencia actualizarSectorExperiencia(Integer id, SectorExperiencia datos) {
        SectorExperiencia sector = sectorExperienciaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("SectorExperiencia no encontrado: " + id));
        sector.setNombre(datos.getNombre());
        return sectorExperienciaRepository.save(sector);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPOS DE SERVICIO
    // ═══════════════════════════════════════════════════════════════════════════
    public List<TipoServicio> listarTiposServicios() {
        return tipoServicioRepository.findAll();
    }

    public TipoServicio crearTipoServicio(TipoServicio tipoServicio) {
        return tipoServicioRepository.save(tipoServicio);
    }

    public TipoServicio actualizarTipoServicio(Integer id, TipoServicio datos) {
        TipoServicio ts = tipoServicioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TipoServicio no encontrado: " + id));
        ts.setNombre(datos.getNombre());
        return tipoServicioRepository.save(ts);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TIPOS DE PROYECTO
    // ═══════════════════════════════════════════════════════════════════════════
    public List<TipoProyecto> listarTiposProyecto() {
        return tipoProyectoRepository.findAll();
    }

    public TipoProyecto crearTipoProyecto(TipoProyecto tipoProyecto) {
        return tipoProyectoRepository.save(tipoProyecto);
    }

    public TipoProyecto actualizarTipoProyecto(Integer id, TipoProyecto datos) {
        TipoProyecto tp = tipoProyectoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("TipoProyecto no encontrado: " + id));
        tp.setNombre(datos.getNombre());
        return tipoProyectoRepository.save(tp);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPETENCIAS TÉCNICAS
    // ═══════════════════════════════════════════════════════════════════════════
    public List<CompetenciaTecnica> listarCompetenciasTecnicas() {
        return competenciaTecnicaRepository.findAll();
    }

    public CompetenciaTecnica crearCompetenciaTecnica(CompetenciaTecnica competencia) {
        return competenciaTecnicaRepository.save(competencia);
    }

    public CompetenciaTecnica actualizarCompetenciaTecnica(Integer id, CompetenciaTecnica datos) {
        CompetenciaTecnica ct = competenciaTecnicaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CompetenciaTecnica no encontrada: " + id));
        ct.setNombre(datos.getNombre());
        return competenciaTecnicaRepository.save(ct);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // COMPETENCIAS TRANSVERSALES
    // ═══════════════════════════════════════════════════════════════════════════
    public List<CompetenciaTransversal> listarCompetenciasTransversales() {
        return competenciaTransversalRepository.findAll();
    }

    public CompetenciaTransversal crearCompetenciaTransversal(CompetenciaTransversal competencia) {
        return competenciaTransversalRepository.save(competencia);
    }

    public CompetenciaTransversal actualizarCompetenciaTransversal(Integer id, CompetenciaTransversal datos) {
        CompetenciaTransversal ct = competenciaTransversalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("CompetenciaTransversal no encontrada: " + id));
        ct.setNombre(datos.getNombre());
        return competenciaTransversalRepository.save(ct);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ÁREAS DE CONOCIMIENTO
    // ═══════════════════════════════════════════════════════════════════════════
    public List<AreaConocimiento> listarAreasConocimiento() {
        return areaConocimientoRepository.findAll();
    }

    public AreaConocimiento crearAreaConocimiento(AreaConocimiento area) {
        return areaConocimientoRepository.save(area);
    }

    public AreaConocimiento actualizarAreaConocimiento(Integer id, AreaConocimiento datos) {
        AreaConocimiento area = areaConocimientoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AreaConocimiento no encontrada: " + id));
        area.setNombre(datos.getNombre());
        return areaConocimientoRepository.save(area);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ÁREAS DE ESPECIALIDAD
    // ═══════════════════════════════════════════════════════════════════════════
    public List<AreaEspecialidad> listarAreasEspecialidad() {
        return areaEspecialidadRepository.findAll();
    }

    public AreaEspecialidad crearAreaEspecialidad(AreaEspecialidad area) {
        return areaEspecialidadRepository.save(area);
    }

    public AreaEspecialidad actualizarAreaEspecialidad(Integer id, AreaEspecialidad datos) {
        AreaEspecialidad area = areaEspecialidadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("AreaEspecialidad no encontrada: " + id));
        area.setNombre(datos.getNombre());
        return areaEspecialidadRepository.save(area);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // INTERESES / REDES (intereses en DTO)
    // ═══════════════════════════════════════════════════════════════════════════
    public List<InteresRed> listarIntereses() {
        return interesRedRepository.findAll();
    }

    public InteresRed crearInteres(InteresRed interes) {
        return interesRedRepository.save(interes);
    }

    public InteresRed actualizarInteres(Integer id, InteresRed datos) {
        InteresRed interes = interesRedRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("InteresRed no encontrado: " + id));
        interes.setNombre(datos.getNombre());
        return interesRedRepository.save(interes);
    }
}

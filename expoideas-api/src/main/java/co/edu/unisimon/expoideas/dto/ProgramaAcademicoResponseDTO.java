package co.edu.unisimon.expoideas.dto;

import co.edu.unisimon.expoideas.entity.ProgramaAcademico;

/**
 * Programa académico con su facultad ya resuelta.
 */
public record ProgramaAcademicoResponseDTO(Integer id, String nombre, Integer facultadId, String facultad) {

    /** Requiere la facultad cargada (fetch join o dentro de la transacción). */
    public static ProgramaAcademicoResponseDTO from(ProgramaAcademico programa) {
        return new ProgramaAcademicoResponseDTO(
                programa.getId(),
                programa.getNombre(),
                programa.getFacultad().getId(),
                programa.getFacultad().getNombre());
    }
}

package co.edu.unisimon.expoideas.dto;

import co.edu.unisimon.expoideas.entity.Catalogo;

/**
 * Registro de un catálogo que solo tiene nombre.
 */
public record CatalogoResponseDTO(Integer id, String nombre) {

    public static CatalogoResponseDTO from(Catalogo catalogo) {
        return new CatalogoResponseDTO(catalogo.getId(), catalogo.getNombre());
    }
}

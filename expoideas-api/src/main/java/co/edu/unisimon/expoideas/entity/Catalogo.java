package co.edu.unisimon.expoideas.entity;

/**
 * Catálogo maestro que solo tiene nombre (sede, facultad, categoría, keyword).
 * Permite a MasterDataService tratar los cuatro con el mismo código.
 * Los getters y setters los genera Lombok en cada entidad.
 */
public interface Catalogo {

    Integer getId();

    String getNombre();

    void setNombre(String nombre);
}

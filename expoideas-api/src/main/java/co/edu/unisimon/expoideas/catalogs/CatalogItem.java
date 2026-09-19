package co.edu.unisimon.expoideas.catalogs;

/**
 * Catálogo que solo tiene nombre (sede, facultad, categoría, keyword). Permite a
 * CatalogService tratar los cuatro con el mismo código.
 */
public interface CatalogItem {

    Integer getId();

    String getName();

    void setName(String name);
}

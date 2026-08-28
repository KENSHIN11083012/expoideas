package com.dattapro.dattapro_api.entity;

import java.io.Serializable;
import java.util.Objects;
import lombok.Data;

@Data
public class UsuarioAreaId implements Serializable {
    private Integer usuario;
    private Integer area;
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UsuarioAreaId that = (UsuarioAreaId) o;
        return Objects.equals(usuario, that.usuario) && Objects.equals(area, that.area);
    }

    @Override
    public int hashCode() {
        return Objects.hash(usuario, area);
    }
}

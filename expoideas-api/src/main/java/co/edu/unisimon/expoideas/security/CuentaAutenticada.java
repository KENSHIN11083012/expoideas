package co.edu.unisimon.expoideas.security;

import co.edu.unisimon.expoideas.entity.PendienteDeIngreso;
import co.edu.unisimon.expoideas.entity.Usuario;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.List;

/**
 * Principal de Spring Security: el User de siempre (correo, hash y ROLE_...)
 * más los pasos de primer ingreso sin completar, que PrimerIngresoFilter
 * consulta en cada petición. Se arma desde la BD en cada petición, así que un
 * paso completado deja de bloquear en la siguiente.
 */
public class CuentaAutenticada extends User {

    private final List<PendienteDeIngreso> pendientesDeIngreso;

    public CuentaAutenticada(Usuario usuario) {
        super(usuario.getCorreoInstitucional(), usuario.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name().toUpperCase())));
        this.pendientesDeIngreso = List.copyOf(usuario.pendientesDeIngreso());
    }

    public List<PendienteDeIngreso> getPendientesDeIngreso() {
        return pendientesDeIngreso;
    }
}

package co.edu.unisimon.expoideas.entity;

import org.junit.jupiter.api.Test;

import java.util.EnumSet;

import static co.edu.unisimon.expoideas.entity.RolUsuario.admin;
import static co.edu.unisimon.expoideas.entity.RolUsuario.docente;
import static co.edu.unisimon.expoideas.entity.RolUsuario.estudiante;
import static co.edu.unisimon.expoideas.entity.RolUsuario.jurado;
import static co.edu.unisimon.expoideas.entity.RolUsuario.macondolab;
import static org.assertj.core.api.Assertions.assertThat;

/** Reglas de los roles acordadas para Expoideas. */
class RolUsuarioTest {

    @Test
    void soloDocentesYEstudiantesDeclaranAdscripcion() {
        assertThat(EnumSet.allOf(RolUsuario.class).stream().filter(RolUsuario::requiereAdscripcion))
                .containsExactlyInAnyOrder(docente, estudiante);
    }

    @Test
    void rolesDeGestionSonAdministradorYMacondoLab() {
        assertThat(EnumSet.allOf(RolUsuario.class).stream().filter(RolUsuario::esDeGestion))
                .containsExactlyInAnyOrder(admin, macondolab);
    }

    @Test
    void administradorGestionaTodosLosRoles() {
        assertThat(EnumSet.allOf(RolUsuario.class)).allMatch(admin::puedeGestionar);
    }

    @Test
    void macondoLabGestionaSoloCuentasQueNoSonDeGestion() {
        assertThat(EnumSet.allOf(RolUsuario.class).stream().filter(macondolab::puedeGestionar))
                .containsExactlyInAnyOrder(docente, jurado, estudiante);
    }

    @Test
    void losDemasRolesNoGestionanCuentas() {
        for (RolUsuario rol : EnumSet.of(docente, jurado, estudiante)) {
            assertThat(EnumSet.allOf(RolUsuario.class)).noneMatch(rol::puedeGestionar);
        }
    }
}

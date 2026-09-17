package co.edu.unisimon.expoideas.entity;

import org.junit.jupiter.api.Test;

import static co.edu.unisimon.expoideas.entity.PendienteDeIngreso.autorizarDatos;
import static co.edu.unisimon.expoideas.entity.PendienteDeIngreso.cambiarPassword;
import static org.assertj.core.api.Assertions.assertThat;

class UsuarioTest {

    @Test
    void cuentaRegistradaConConsentimientoNoTienePendientes() {
        Usuario usuario = Usuario.builder().autorizaDatos(true).build();

        assertThat(usuario.pendientesDeIngreso()).isEmpty();
    }

    @Test
    void cuentaCreadaPorLaGestionPideContrasenaYLuegoConsentimiento() {
        Usuario usuario = Usuario.builder().debeCambiarPassword(true).autorizaDatos(false).build();

        assertThat(usuario.pendientesDeIngreso()).containsExactly(cambiarPassword, autorizarDatos);
    }

    @Test
    void contrasenaRestablecidaSoloPideCambiarla() {
        Usuario usuario = Usuario.builder().debeCambiarPassword(true).autorizaDatos(true).build();

        assertThat(usuario.pendientesDeIngreso()).containsExactly(cambiarPassword);
    }

    @Test
    void sinConsentimientoRegistradoLoPide() {
        Usuario usuario = Usuario.builder().build();

        assertThat(usuario.pendientesDeIngreso()).containsExactly(autorizarDatos);
    }
}

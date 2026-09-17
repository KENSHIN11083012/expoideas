package co.edu.unisimon.expoideas.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import co.edu.unisimon.expoideas.entity.PendienteDeIngreso;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String rol;
    /** El frontend lo necesita para saber quién inició sesión sin pedir otra vez /usuarios/me. */
    private Integer id;
    private String nombres;
    private String apellidos;
    /** Si no está vacío, el frontend lleva a la pantalla de primer ingreso en vez de la de inicio. */
    private List<PendienteDeIngreso> pendientes;
}

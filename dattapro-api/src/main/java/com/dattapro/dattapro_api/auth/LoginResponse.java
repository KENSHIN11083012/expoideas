package com.dattapro.dattapro_api.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}

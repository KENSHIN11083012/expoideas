package co.edu.unisimon.expoideas.users;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Gestión de cuentas por MacondoLab y administradores. SecurityConfig exige
 * ROLE_MACONDOLAB (que ROLE_ADMIN incluye) y ROLE_ADMIN para eliminar. Lo que
 * depende de a quién se gestiona lo decide UserManagementService y responde 403
 * con el motivo.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
public class UserAdminController {

    private final UserManagementService managementService;

    @GetMapping
    public List<UserResponse> list() {
        return managementService.list();
    }

    /** Crea una cuenta con contraseña temporal. 409 si el correo ya existe. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(Authentication authentication, @Valid @RequestBody UserCreateRequest request) {
        return managementService.create(authentication.getName(), request);
    }

    /** Cambia rol y adscripción. */
    @PutMapping("/{id}")
    public UserResponse update(
            Authentication authentication, @PathVariable Integer id, @Valid @RequestBody UserUpdateRequest request) {
        return managementService.update(authentication.getName(), id, request);
    }

    /** Pone una contraseña temporal sin conocer la actual. */
    @PostMapping("/{id}/password-reset")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(
            Authentication authentication, @PathVariable Integer id, @Valid @RequestBody PasswordResetRequest request) {
        managementService.resetPassword(authentication.getName(), id, request);
    }

    /** Solo administradores. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication, @PathVariable Integer id) {
        managementService.delete(authentication.getName(), id);
    }
}

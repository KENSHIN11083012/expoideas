package co.edu.unisimon.expoideas.security;

import co.edu.unisimon.expoideas.users.OnboardingStep;
import co.edu.unisimon.expoideas.users.Role;
import co.edu.unisimon.expoideas.users.User;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

/**
 * Cuenta autenticada: el User de Spring Security (correo, hash y ROLE_...) más
 * el rol y los pasos de primer ingreso sin completar, que OnboardingFilter
 * consulta en cada petición. Se arma desde la BD en cada petición, así que un
 * cambio de rol o un paso completado cuentan desde la siguiente.
 */
public class UserPrincipal extends org.springframework.security.core.userdetails.User {

    private final Role role;
    private final List<OnboardingStep> pendingSteps;

    public UserPrincipal(User user) {
        super(
                user.getEmail(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority(user.getRole().authority())));
        this.role = user.getRole();
        this.pendingSteps = List.copyOf(user.pendingSteps());
    }

    public Role getRole() {
        return role;
    }

    public List<OnboardingStep> getPendingSteps() {
        return pendingSteps;
    }
}

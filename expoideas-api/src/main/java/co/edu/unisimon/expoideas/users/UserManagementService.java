package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.ForbiddenActionException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.common.ValidationPatterns;
import co.edu.unisimon.expoideas.files.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Gestión de cuentas por MacondoLab y administradores: listar, crear, cambiar
 * rol o adscripción, restablecer contraseñas y eliminar. SecurityConfig decide
 * quién entra a estas rutas; aquí se decide a quién se puede gestionar (con
 * {@link Role#canManage}), con la cuenta de la sesión como actor.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final AffiliationResolver affiliation;
    private final PasswordUpdater passwords;
    private final FileService fileService;

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return userRepository.findAllWithProfileBy().stream().map(UserResponse::from).toList();
    }

    /**
     * Alta con contraseña temporal: jurados externos o cuentas que nacen con un
     * rol distinto de estudiante. La autorización de datos queda pendiente porque
     * no la dio la persona; la da en su primer ingreso.
     *
     * @throws ForbiddenActionException si el actor no puede gestionar el rol pedido
     * @throws InvalidFieldsException   si el correo no es institucional (salvo jurados) o falta la adscripción
     * @throws ConflictException        si el correo ya está en uso
     * @throws NoSuchElementException   si la sede, la facultad o el programa no existen
     */
    @Transactional
    public UserResponse create(String actorEmail, UserCreateRequest request) {
        User actor = findByEmail(actorEmail);
        if (!actor.getRole().canManage(request.role())) {
            throw new ForbiddenActionException(
                    "Solo un administrador puede crear cuentas de administración o de MacondoLab.");
        }
        String email = request.email().strip();
        Map<String, String> invalid = new LinkedHashMap<>();
        if (request.role() != Role.JUDGE && !email.matches(ValidationPatterns.INSTITUTIONAL_EMAIL)) {
            invalid.put("email", "Solo los jurados pueden tener un correo externo; usa uno @unisimon.edu.co");
        }
        if (request.role().requiresAffiliation()) {
            invalid.putAll(AffiliationResolver.missingFields(request.campusId(), request.facultyId()));
        }
        if (!invalid.isEmpty()) {
            throw new InvalidFieldsException(invalid);
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("El correo " + email + " ya pertenece a otro usuario.");
        }

        User user = User.builder()
                .firstName(request.firstName().strip())
                .lastName(request.lastName().strip())
                .email(email)
                .passwordHash(passwords.hash(request.password()))
                .role(request.role())
                .mustChangePassword(true)
                .build();
        if (request.role().requiresAffiliation()) {
            affiliation.assign(user, request.campusId(), request.facultyId(), request.academicProgramId());
        }

        User saved = userRepository.save(user);
        log.info("Usuario ID {} creado desde la gestión con rol {}", saved.getId(), saved.getRole());
        return UserResponse.from(saved);
    }

    /**
     * Cambia rol y adscripción.
     *
     * @throws ForbiddenActionException si el actor no puede gestionar la cuenta o el rol pedido, o cambia su propio rol
     * @throws IllegalArgumentException si llega adscripción para un rol que no la lleva
     * @throws InvalidFieldsException   si el programa es de otra facultad
     * @throws NoSuchElementException   si la cuenta, la sede, la facultad o el programa no existen
     */
    @Transactional
    public UserResponse update(String actorEmail, Integer id, UserUpdateRequest request) {
        User actor = findByEmail(actorEmail);
        User user = findById(id);
        requireCanManage(actor, user);
        if (request.role() != null && request.role() != user.getRole()) {
            if (actor.getId().equals(user.getId())) {
                throw new ForbiddenActionException("No puedes cambiar tu propio rol.");
            }
            if (!actor.getRole().canManage(request.role())) {
                throw new ForbiddenActionException(
                        "Solo un administrador puede asignar los roles Administrador o MacondoLab.");
            }
            user.setRole(request.role());
        }

        boolean hasAffiliation =
                request.campusId() != null || request.facultyId() != null || request.academicProgramId() != null;
        if (hasAffiliation && !user.getRole().requiresAffiliation()) {
            throw new IllegalArgumentException("El rol de este usuario no lleva adscripción académica.");
        }
        if (request.campusId() != null) {
            affiliation.assignCampus(user, request.campusId());
        }
        if (request.facultyId() != null) {
            affiliation.assignFaculty(user, request.facultyId(), request.academicProgramId());
        } else if (request.academicProgramId() != null) {
            affiliation.assignProgram(user, request.academicProgramId());
        }

        log.info("Usuario ID {} actualizado desde la gestión", id);
        return UserResponse.from(user);
    }

    /**
     * Restablece la contraseña sin conocer la actual. Queda como temporal: se
     * cambia en el siguiente ingreso.
     *
     * @throws ForbiddenActionException si el actor no puede gestionar la cuenta o es la suya
     * @throws InvalidFieldsException   si la confirmación no coincide o es igual a la actual
     * @throws NoSuchElementException   si la cuenta no existe
     */
    @Transactional
    public void resetPassword(String actorEmail, Integer id, PasswordResetRequest request) {
        User actor = findByEmail(actorEmail);
        User user = findById(id);
        if (actor.getId().equals(user.getId())) {
            // Por aquí no se pide la contraseña actual: la propia se cambia en /users/me/password.
            throw new ForbiddenActionException("Para cambiar tu propia contraseña usa la opción Seguridad de tu cuenta.");
        }
        requireCanManage(actor, user);
        passwords.replace(user, request.newPassword(), request.confirmPassword(), true);
        log.info("Contraseña del usuario ID {} restablecida desde la gestión", id);
    }

    /**
     * Elimina la cuenta con sus archivos. Solo administradores (lo exige SecurityConfig).
     *
     * @throws ForbiddenActionException si es la propia cuenta
     * @throws NoSuchElementException   si el id no existe
     */
    @Transactional
    public void delete(String actorEmail, Integer id) {
        User actor = findByEmail(actorEmail);
        User user = findById(id);
        if (actor.getId().equals(user.getId())) {
            throw new ForbiddenActionException("No puedes eliminar tu propia cuenta.");
        }
        // Sus archivos no pueden quedar sin dueño: se borran con la cuenta.
        user.setPhoto(null);
        fileService.deleteAllOwnedBy(user);
        userRepository.delete(user);
        log.info("Usuario ID {} eliminado", id);
    }

    private static void requireCanManage(User actor, User target) {
        if (!actor.getRole().canManage(target.getRole())) {
            throw new ForbiddenActionException(
                    "Solo un administrador puede modificar cuentas de administración o de MacondoLab.");
        }
    }

    private User findById(Integer id) {
        return userRepository.findWithProfileById(id)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con ID: " + id));
    }

    private User findByEmail(String email) {
        return userRepository.findWithProfileByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + email));
    }
}

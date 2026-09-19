package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.common.ConflictException;
import co.edu.unisimon.expoideas.common.InvalidFieldsException;
import co.edu.unisimon.expoideas.files.FileFormat;
import co.edu.unisimon.expoideas.files.FileService;
import co.edu.unisimon.expoideas.files.FileVisibility;
import co.edu.unisimon.expoideas.files.StoredFile;
import java.util.NoSuchElementException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Lo que cada persona hace con su propia cuenta: registrarse, ver y editar su
 * perfil, su foto, autorizar el tratamiento de datos y cambiar su contraseña.
 * La cuenta siempre se identifica por el correo de la sesión, nunca por un id
 * que venga del cliente.
 *
 * <p>Los métodos devuelven respuestas ya armadas dentro de la transacción: con
 * open-in-view desactivado, fuera de aquí no se pueden recorrer relaciones lazy.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserAccountService {

    private final UserRepository userRepository;
    private final AffiliationResolver affiliation;
    private final PasswordUpdater passwords;
    private final FileService fileService;

    /**
     * Registro público: la cuenta nace como estudiante, con la autorización de
     * datos que exige el formulario.
     *
     * @throws ConflictException      si el correo ya está en uso
     * @throws InvalidFieldsException si el programa es de otra facultad
     * @throws NoSuchElementException si la sede, la facultad o el programa no existen
     */
    @Transactional
    public UserResponse register(RegistrationRequest request) {
        String email = request.email().strip();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("El correo institucional ya está registrado.");
        }
        User user = User.builder()
                .firstName(request.firstName().strip())
                .lastName(request.lastName().strip())
                .email(email)
                .passwordHash(passwords.hash(request.password()))
                .role(Role.STUDENT)
                .build();
        user.giveDataConsent();
        affiliation.assign(user, request.campusId(), request.facultyId(), request.academicProgramId());

        User saved = userRepository.save(user);
        log.info("Usuario registrado con ID {}", saved.getId());
        return UserResponse.from(saved);
    }

    /** @throws NoSuchElementException si el correo no existe */
    @Transactional(readOnly = true)
    public UserResponse getProfile(String email) {
        return UserResponse.from(findByEmail(email));
    }

    /**
     * Reemplaza nombre y, si el rol la lleva, adscripción académica.
     *
     * @throws InvalidFieldsException si faltan sede o facultad, o el programa es de otra facultad
     * @throws NoSuchElementException si la sede, la facultad o el programa no existen
     */
    @Transactional
    public UserResponse updateProfile(String email, ProfileUpdateRequest request) {
        User user = findByEmail(email);
        if (user.getRole().requiresAffiliation()) {
            affiliation.assign(user, request.campusId(), request.facultyId(), request.academicProgramId());
        }
        user.setFirstName(request.firstName().strip());
        user.setLastName(request.lastName().strip());
        return UserResponse.from(user);
    }

    /**
     * Sube o reemplaza la foto de perfil. La anterior se borra cuando la nueva
     * queda guardada.
     *
     * @throws InvalidFieldsException si no es JPG, PNG o WEBP, está vacía o pasa de 5 MB
     */
    @Transactional
    public UserResponse updatePhoto(String email, MultipartFile upload) {
        User user = findByEmail(email);
        StoredFile previous = user.getPhoto();
        user.setPhoto(fileService.store(upload, FileFormat.IMAGES, FileVisibility.PUBLIC, user));
        if (previous != null) {
            fileService.delete(previous);
        }
        return UserResponse.from(user);
    }

    /** Quita la foto de perfil, si tiene. */
    @Transactional
    public void deletePhoto(String email) {
        User user = findByEmail(email);
        StoredFile photo = user.getPhoto();
        if (photo != null) {
            user.setPhoto(null);
            fileService.delete(photo);
        }
    }

    /** Autorización de tratamiento de datos; si ya la había dado, conserva la fecha original. */
    @Transactional
    public void giveDataConsent(String email) {
        User user = findByEmail(email);
        if (!user.isDataConsent()) {
            user.giveDataConsent();
            log.info("Usuario ID {} autorizó el tratamiento de datos", user.getId());
        }
    }

    /**
     * Cambio de la propia contraseña, verificando la actual. Quita la marca de
     * contraseña temporal.
     *
     * @throws InvalidFieldsException si la actual no coincide, o la nueva no se confirma o es igual a la actual
     */
    @Transactional
    public void changePassword(String email, PasswordChangeRequest request) {
        User user = findByEmail(email);
        if (!passwords.matches(user, request.currentPassword())) {
            throw new InvalidFieldsException("currentPassword", "La contraseña actual es incorrecta.");
        }
        passwords.replace(user, request.newPassword(), request.confirmPassword(), false);
    }

    private User findByEmail(String email) {
        return userRepository
                .findWithProfileByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("No existe un usuario con correo: " + email));
    }
}

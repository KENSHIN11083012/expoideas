package co.edu.unisimon.expoideas.users;

import co.edu.unisimon.expoideas.catalogs.AcademicProgram;
import co.edu.unisimon.expoideas.catalogs.Campus;
import co.edu.unisimon.expoideas.catalogs.Faculty;
import co.edu.unisimon.expoideas.files.StoredFile;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedAttributeNode;
import jakarta.persistence.NamedEntityGraph;
import jakarta.persistence.NamedSubgraph;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cuenta de la plataforma: identidad, rol, adscripción académica y estado del
 * primer ingreso.
 *
 * <p>Sin @Data a propósito: equals/hashCode/toString sobre relaciones lazy
 * dispararían consultas por accidente.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
@NamedEntityGraph(
        name = User.WITH_PROFILE,
        attributeNodes = {
            @NamedAttributeNode("campus"),
            @NamedAttributeNode("faculty"),
            @NamedAttributeNode(value = "academicProgram", subgraph = "program"),
            @NamedAttributeNode("photo")
        },
        subgraphs = @NamedSubgraph(name = "program", attributeNodes = @NamedAttributeNode("faculty")))
public class User {

    /** Grafo con todo lo que muestra el perfil: evita una consulta por relación al armar la respuesta. */
    public static final String WITH_PROFILE = "User.withProfile";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String firstName;

    /** Ambos apellidos. */
    @Column(nullable = false, length = 100)
    private String lastName;

    /** Institucional (@unisimon.edu.co), salvo los jurados externos. Es el usuario del login. */
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    /** Hash BCrypt. La API responde con DTOs; @JsonIgnore es solo una red por si acaso. */
    @JsonIgnore
    @Column(nullable = false)
    private String passwordHash;

    /** La contraseña la puso la gestión (cuenta creada o restablecida): es temporal. */
    @Builder.Default
    @Column(nullable = false)
    private boolean mustChangePassword = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role = Role.STUDENT;

    /** Autorización de tratamiento de datos personales (Ley 1581 de 2012). */
    @Builder.Default
    @Column(nullable = false)
    private boolean dataConsent = false;

    private LocalDateTime dataConsentAt;

    @ManyToOne(fetch = FetchType.LAZY)
    private Campus campus;

    /** Se guarda aparte del programa porque un docente pertenece a una facultad sin estar en un programa. */
    @ManyToOne(fetch = FetchType.LAZY)
    private Faculty faculty;

    /** Opcional; si existe, pertenece a {@link #faculty}. */
    @ManyToOne(fetch = FetchType.LAZY)
    private AcademicProgram academicProgram;

    /** Foto de perfil: un archivo público subido por la propia persona. */
    @ManyToOne(fetch = FetchType.LAZY)
    private StoredFile photo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Lo que la cuenta debe resolver antes de usar la plataforma, en el orden en que se pide. */
    public List<OnboardingStep> pendingSteps() {
        List<OnboardingStep> steps = new ArrayList<>();
        if (mustChangePassword) {
            steps.add(OnboardingStep.CHANGE_PASSWORD);
        }
        if (!dataConsent) {
            steps.add(OnboardingStep.DATA_CONSENT);
        }
        return steps;
    }

    /** Deja constancia de la autorización de datos; si ya estaba, conserva la fecha original. */
    public void giveDataConsent() {
        if (!dataConsent) {
            dataConsent = true;
            dataConsentAt = LocalDateTime.now();
        }
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

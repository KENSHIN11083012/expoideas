package co.edu.unisimon.expoideas.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Una persona del listado de la cátedra: su correo institucional, el rol con el
 * que nacerá su cuenta cuando se registre y, si venía, su nombre. No es una
 * cuenta: solo se consulta al registrarse.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "roster_entries")
public class RosterEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Siempre en minúsculas: así el cruce con el correo del registro no depende de cómo lo escribieron. */
    @Column(nullable = false, length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public static RosterEntry of(String email) {
        RosterEntry entry = new RosterEntry();
        entry.setEmail(email);
        return entry;
    }

    public boolean hasName() {
        return firstName != null && lastName != null;
    }

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

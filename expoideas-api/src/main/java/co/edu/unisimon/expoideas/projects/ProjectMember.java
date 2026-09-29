package co.edu.unisimon.expoideas.projects;

import co.edu.unisimon.expoideas.users.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Una persona en el equipo de un proyecto, con su papel y su estado. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "project_members")
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "team_role", nullable = false, length = 20)
    private MemberRole teamRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MembershipStatus status;

    @Column(name = "invited_at", nullable = false, updatable = false)
    private LocalDateTime invitedAt;

    /** Cuándo aceptó. El líder la lleva puesta desde que inscribe el proyecto. */
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    public boolean isLeader() {
        return teamRole == MemberRole.LEADER;
    }

    public boolean isAccepted() {
        return status == MembershipStatus.ACCEPTED;
    }

    /** Marca la invitación como aceptada, con la fecha de la respuesta. */
    public void accept() {
        status = MembershipStatus.ACCEPTED;
        respondedAt = LocalDateTime.now();
    }

    @PrePersist
    void onCreate() {
        if (invitedAt == null) {
            invitedAt = LocalDateTime.now();
        }
    }
}

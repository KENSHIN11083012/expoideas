package co.edu.unisimon.expoideas.editions;

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Lo que MacondoLab configura de una cátedra en una edición. Por ahora, el
 * tamaño del grupo; los entregables de cada cátedra se suman en su propia fase.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "edition_tracks")
public class EditionTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "edition_id", nullable = false)
    private Edition edition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Track track;

    /** Integrantes del grupo, contando al líder. */
    @Column(name = "min_members", nullable = false)
    private int minMembers;

    @Column(name = "max_members", nullable = false)
    private int maxMembers;
}

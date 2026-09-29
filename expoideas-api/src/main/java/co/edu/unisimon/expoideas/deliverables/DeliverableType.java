package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.editions.Edition;
import co.edu.unisimon.expoideas.editions.Track;
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
 * Un entregable que pide una cátedra en una edición: su nombre, qué archivos
 * acepta, si es obligatorio y cuántos archivos admite.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "deliverable_types")
public class DeliverableType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "edition_id", nullable = false)
    private Edition edition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Track track;

    @Column(nullable = false, length = 100)
    private String name;

    /** Qué se espera y en qué condiciones; lo lee el equipo antes de subir. */
    @Column(length = 300)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeliverableKind kind;

    /** Si falta, el proyecto queda incompleto. La evaluación lo tendrá en cuenta. */
    @Column(name = "is_required", nullable = false)
    private boolean required = true;

    @Column(name = "max_files", nullable = false)
    private int maxFiles = 1;

    /** Orden en el que se muestran los entregables de la cátedra. */
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}

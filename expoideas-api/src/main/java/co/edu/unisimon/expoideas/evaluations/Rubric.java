package co.edu.unisimon.expoideas.evaluations;

import co.edu.unisimon.expoideas.editions.Track;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * La rúbrica con la que los jurados califican los proyectos de una cátedra: el
 * póster en INNPRENDE I y el pitch en INNPRENDE II. La define MacondoLab y se
 * carga con las migraciones (ver docs/rubricas.md); la API solo la lee.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "rubrics")
public class Rubric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Track track;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 300)
    private String description;

    @OneToMany(mappedBy = "rubric")
    @OrderBy("position ASC")
    private List<RubricCriterion> criteria = new ArrayList<>();
}

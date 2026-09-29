package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.editions.Track;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliverableTypeRepository extends JpaRepository<DeliverableType, Integer> {

    /** Los entregables que pide una cátedra, en el orden configurado. */
    List<DeliverableType> findByEditionIdAndTrackOrderBySortOrderAscIdAsc(Integer editionId, Track track);
}

package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.editions.Track;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DeliverableTypeRepository extends JpaRepository<DeliverableType, Integer> {

    /** Los entregables que pide una cátedra, en el orden configurado. */
    List<DeliverableType> findByEditionIdAndTrackOrderBySortOrderAscIdAsc(Integer editionId, Track track);

    /** Cuántos entregables obligatorios pide cada cátedra de cada edición. */
    @Query("""
            select t.edition.id as editionId, t.track as track, count(t) as total
            from DeliverableType t where t.required = true group by t.edition.id, t.track
            """)
    List<RequiredByTrack> countRequiredByTrack();

    /** Fila de {@link #countRequiredByTrack()}. */
    interface RequiredByTrack {
        Integer getEditionId();

        Track getTrack();

        int getTotal();
    }
}

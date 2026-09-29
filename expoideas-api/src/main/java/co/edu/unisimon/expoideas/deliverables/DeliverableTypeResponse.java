package co.edu.unisimon.expoideas.deliverables;

import co.edu.unisimon.expoideas.editions.Track;

/** Un entregable configurado, tal como sale por la API. */
public record DeliverableTypeResponse(
        Integer id,
        Integer editionId,
        Track track,
        String name,
        String description,
        DeliverableKind kind,
        boolean required,
        int maxFiles,
        int sortOrder) {

    public static DeliverableTypeResponse from(DeliverableType type) {
        return new DeliverableTypeResponse(
                type.getId(),
                type.getEdition().getId(),
                type.getTrack(),
                type.getName(),
                type.getDescription(),
                type.getKind(),
                type.isRequired(),
                type.getMaxFiles(),
                type.getSortOrder());
    }
}

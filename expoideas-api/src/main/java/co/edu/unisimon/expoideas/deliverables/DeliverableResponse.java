package co.edu.unisimon.expoideas.deliverables;

import java.time.LocalDateTime;

/**
 * Un archivo subido. {@code fileId} es el identificador público con el que se
 * descarga (GET /api/v1/files/{fileId}).
 */
public record DeliverableResponse(
        Integer id,
        String fileId,
        String fileName,
        String contentType,
        int sizeBytes,
        String uploadedBy,
        LocalDateTime uploadedAt) {

    public static DeliverableResponse from(Deliverable deliverable) {
        return new DeliverableResponse(
                deliverable.getId(),
                deliverable.getFile().getUuid(),
                deliverable.getFile().getOriginalName(),
                deliverable.getFile().getContentType(),
                deliverable.getFile().getSizeBytes(),
                deliverable.getUploadedBy().fullName(),
                deliverable.getUploadedAt());
    }
}

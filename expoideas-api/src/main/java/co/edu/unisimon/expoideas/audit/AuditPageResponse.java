package co.edu.unisimon.expoideas.audit;

import java.util.List;
import org.springframework.data.domain.Page;

/**
 * Una página del rastro, de lo más reciente a lo más antiguo.
 *
 * @param page       la página pedida; la primera es 0
 * @param totalItems cuántas filas cumplen los filtros, en todas las páginas
 */
public record AuditPageResponse(List<AuditEventResponse> items, int page, int size, long totalItems, int totalPages) {

    static AuditPageResponse from(Page<AuditEvent> page) {
        return new AuditPageResponse(
                page.getContent().stream().map(AuditEventResponse::from).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages());
    }
}

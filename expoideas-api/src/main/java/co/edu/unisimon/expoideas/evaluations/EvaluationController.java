package co.edu.unisimon.expoideas.evaluations;

import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Evaluación de proyectos. Cada jurado asignado guarda y corrige la suya; el
 * profesor del grupo y la gestión ven la nota del proyecto con el detalle. Quién
 * puede qué lo decide EvaluationService: ser jurado es una asignación, no un rol.
 */
@RestController
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    /** La evaluación de quien consulta, o 204 si todavía no ha calificado ese proyecto. */
    @GetMapping("/api/v1/projects/{projectId}/evaluations/mine")
    public ResponseEntity<EvaluationResponse> mine(@PathVariable Integer projectId, Authentication authentication) {
        return evaluationService
                .mine(projectId, authentication.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PutMapping("/api/v1/projects/{projectId}/evaluations/mine")
    public EvaluationResponse save(
            @PathVariable Integer projectId,
            Authentication authentication,
            @Valid @RequestBody EvaluationRequest request) {
        return evaluationService.save(projectId, authentication.getName(), request);
    }

    /** La nota del proyecto y lo que puso cada jurado. */
    @GetMapping("/api/v1/projects/{projectId}/evaluations")
    public ProjectEvaluationsResponse results(@PathVariable Integer projectId, Authentication authentication) {
        return evaluationService.results(projectId, authentication.getName());
    }

    /** Todo lo que quien consulta ya calificó. */
    @GetMapping("/api/v1/evaluations/mine")
    public List<EvaluationResponse> allMine(Authentication authentication) {
        return evaluationService.allMine(authentication.getName());
    }
}

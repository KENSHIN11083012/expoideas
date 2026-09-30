package co.edu.unisimon.expoideas.evaluations;

import co.edu.unisimon.expoideas.editions.Track;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/** Las rúbricas: cualquiera con sesión lee la de cada cátedra. Las define MacondoLab. */
@RestController
@RequiredArgsConstructor
public class RubricController {

    private final EvaluationService evaluationService;

    @GetMapping("/api/v1/rubrics/{track}")
    public RubricResponse rubric(@PathVariable Track track) {
        return evaluationService.rubric(track);
    }
}

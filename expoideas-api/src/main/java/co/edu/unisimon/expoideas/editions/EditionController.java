package co.edu.unisimon.expoideas.editions;

import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ediciones de la Expo. La lectura es pública: cualquiera puede ver cuándo abren
 * las inscripciones. Las escribe MacondoLab (ver SecurityConfig). No hay
 * borrado: una edición pasada es el histórico de sus proyectos.
 */
@RestController
@RequestMapping("/api/v1/editions")
@RequiredArgsConstructor
public class EditionController {

    private final EditionService editionService;

    @GetMapping
    @SecurityRequirements
    public List<EditionResponse> list() {
        return editionService.list();
    }

    @GetMapping("/{id}")
    @SecurityRequirements
    public EditionResponse get(@PathVariable Integer id) {
        return editionService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EditionResponse create(@Valid @RequestBody EditionRequest request) {
        return editionService.create(request);
    }

    @PutMapping("/{id}")
    public EditionResponse update(@PathVariable Integer id, @Valid @RequestBody EditionRequest request) {
        return editionService.update(id, request);
    }
}

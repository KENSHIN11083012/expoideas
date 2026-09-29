package co.edu.unisimon.expoideas.projects;

import co.edu.unisimon.expoideas.editions.EditionTrack;
import co.edu.unisimon.expoideas.editions.Track;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Un proyecto con su equipo. Lleva los límites del grupo y si la inscripción
 * sigue abierta para que el cliente sepa qué ofrecer sin consultar la edición.
 */
public record ProjectResponse(
        Integer id,
        Integer editionId,
        String edition,
        Track track,
        String title,
        String summary,
        Integer sectorId,
        String sector,
        Integer teacherId,
        String teacher,
        boolean registrationOpen,
        int minMembers,
        int maxMembers,
        List<MemberResponse> members,
        LocalDateTime createdAt) {

    public static ProjectResponse from(Project project, LocalDate today) {
        EditionTrack settings = project.trackSettings();
        return new ProjectResponse(
                project.getId(),
                project.getEdition().getId(),
                project.getEdition().getName(),
                project.getTrack(),
                project.getTitle(),
                project.getSummary(),
                project.getSector().getId(),
                project.getSector().getName(),
                project.getTeacher().getId(),
                project.getTeacher().fullName(),
                project.getEdition().isRegistrationOpenOn(today),
                settings.getMinMembers(),
                settings.getMaxMembers(),
                project.getMembers().stream().map(MemberResponse::from).toList(),
                project.getCreatedAt());
    }
}

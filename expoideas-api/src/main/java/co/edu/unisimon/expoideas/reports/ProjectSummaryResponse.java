package co.edu.unisimon.expoideas.reports;

import co.edu.unisimon.expoideas.deliverables.DeliverableProgressService.Progress;
import co.edu.unisimon.expoideas.editions.Track;
import co.edu.unisimon.expoideas.projects.MembershipStatus;
import co.edu.unisimon.expoideas.projects.Project;
import co.edu.unisimon.expoideas.projects.ProjectResult;
import java.time.LocalDateTime;

/**
 * Un proyecto en un listado de gestión: lo justo para reconocerlo y ver cómo
 * va, sin su equipo completo ni sus archivos.
 */
public record ProjectSummaryResponse(
        Integer id,
        Integer editionId,
        String edition,
        Track track,
        String title,
        String sector,
        String prototypeType,
        String teacher,
        String leader,
        int members,
        int minMembers,
        int requiredDeliverables,
        int deliveredDeliverables,
        ProjectResult result,
        LocalDateTime createdAt) {

    public static ProjectSummaryResponse of(Project project, Progress progress) {
        return new ProjectSummaryResponse(
                project.getId(),
                project.getEdition().getId(),
                project.getEdition().getName(),
                project.getTrack(),
                project.getTitle(),
                project.getSector().getName(),
                project.getPrototypeType() != null ? project.getPrototypeType().getName() : null,
                project.getTeacher().fullName(),
                project.leader().getUser().fullName(),
                (int) project.getMembers().stream()
                        .filter(member -> member.getStatus() == MembershipStatus.ACCEPTED)
                        .count(),
                project.trackSettings().getMinMembers(),
                progress.required(),
                progress.delivered(),
                project.getResult(),
                project.getCreatedAt());
    }
}

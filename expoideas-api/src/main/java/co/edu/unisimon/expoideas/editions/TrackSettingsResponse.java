package co.edu.unisimon.expoideas.editions;

import java.time.LocalDateTime;

/**
 * Configuración de una cátedra tal como sale por la API.
 *
 * @param gradesPublishedAt desde cuándo los equipos ven su nota, o null si todavía no
 */
public record TrackSettingsResponse(Track track, int minMembers, int maxMembers, LocalDateTime gradesPublishedAt) {

    public static TrackSettingsResponse from(EditionTrack settings) {
        return new TrackSettingsResponse(
                settings.getTrack(),
                settings.getMinMembers(),
                settings.getMaxMembers(),
                settings.getGradesPublishedAt());
    }
}

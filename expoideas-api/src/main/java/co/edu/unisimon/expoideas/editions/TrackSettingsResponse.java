package co.edu.unisimon.expoideas.editions;

/** Configuración de una cátedra tal como sale por la API. */
public record TrackSettingsResponse(Track track, int minMembers, int maxMembers) {

    public static TrackSettingsResponse from(EditionTrack settings) {
        return new TrackSettingsResponse(settings.getTrack(), settings.getMinMembers(), settings.getMaxMembers());
    }
}

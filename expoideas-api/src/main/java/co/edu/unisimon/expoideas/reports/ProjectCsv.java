package co.edu.unisimon.expoideas.reports;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Listado de proyectos en CSV.
 *
 * <p>Separado por punto y coma y con BOM al inicio: así Excel en español lo abre
 * en columnas y con las tildes bien, sin pasar por el asistente de importación.
 */
final class ProjectCsv {

    static final String BOM = "﻿";

    private static final String SEPARATOR = ";";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    private static final List<String> HEADERS = List.of(
            "Edición",
            "Cátedra",
            "Proyecto",
            "Sector",
            "Docente",
            "Líder",
            "Integrantes",
            "Mínimo de integrantes",
            "Entregables obligatorios",
            "Entregados",
            "Inscrito el");

    private ProjectCsv() {}

    static String of(List<ProjectSummaryResponse> projects) {
        StringBuilder csv = new StringBuilder(BOM).append(String.join(SEPARATOR, HEADERS));
        for (ProjectSummaryResponse project : projects) {
            csv.append('\n')
                    .append(row(
                            project.edition(),
                            label(project.track()),
                            project.title(),
                            project.sector(),
                            project.teacher(),
                            project.leader(),
                            String.valueOf(project.members()),
                            String.valueOf(project.minMembers()),
                            String.valueOf(project.requiredDeliverables()),
                            String.valueOf(project.deliveredDeliverables()),
                            project.createdAt() == null ? "" : DATE.format(project.createdAt())));
        }
        return csv.toString();
    }

    /** "INNPRENDE_I" se lee mejor como "INNPRENDE I". */
    private static String label(Enum<?> track) {
        return track.name().replace('_', ' ');
    }

    private static String row(String... values) {
        StringBuilder row = new StringBuilder();
        for (int index = 0; index < values.length; index++) {
            if (index > 0) {
                row.append(SEPARATOR);
            }
            row.append(escape(values[index]));
        }
        return row.toString();
    }

    /** Entre comillas si trae separadores, comillas o saltos de línea. */
    private static String escape(String value) {
        String text = value == null ? "" : value;
        if (text.contains(SEPARATOR) || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return '"' + text.replace("\"", "\"\"") + '"';
        }
        return text;
    }
}

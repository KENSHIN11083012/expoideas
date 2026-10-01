package co.edu.unisimon.expoideas.notifications;

import co.edu.unisimon.expoideas.common.ExpoideasProperties;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Convierte los eventos de la plataforma en correos. Corre después del commit
 * (si la operación falla, no hay aviso) y en otro hilo (quien pidió la operación
 * no espera al servidor de correo). Un envío que falla se registra y no afecta a
 * la operación que ya se confirmó.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationListener {

    private static final Locale SPANISH = Locale.forLanguageTag("es-CO");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM 'de' yyyy", SPANISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", SPANISH);

    private final MailService mailService;
    private final ExpoideasProperties properties;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onTeamInvitation(TeamInvitationEvent event) {
        String subject = "Te invitaron al proyecto \"" + event.projectTitle() + "\"";
        String body = """
                Hola, %s.

                %s te invitó a hacer parte del equipo del proyecto "%s" en %s.

                Entra a Idearium y, en Mis proyectos, acepta o rechaza la invitación.%s

                Cátedra UNISIMÓN INNPRENDE · MacondoLab
                """.formatted(
                        event.inviteeName(),
                        event.leaderName(),
                        event.projectTitle(),
                        event.trackLabel(),
                        appLink("/mis-proyectos"));
        deliver(event.inviteeEmail(), subject, body);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onAccountCreated(AccountCreatedEvent event) {
        String subject = "Tu cuenta en Idearium";
        String body = """
                Hola, %s.

                Te creamos una cuenta en Idearium con el rol de %s.

                Usuario: %s
                Contraseña temporal: %s

                Al entrar por primera vez se te pedirá cambiar la contraseña.%s

                Cátedra UNISIMÓN INNPRENDE · MacondoLab
                """.formatted(
                        event.fullName(),
                        event.roleLabel(),
                        event.email(),
                        event.temporaryPassword(),
                        appLink("/iniciar-sesion"));
        deliver(event.email(), subject, body);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPresentationScheduled(PresentationScheduledEvent event) {
        String subject = (event.rescheduled() ? "Cambió la sustentación de \"" : "Sustentación programada: \"")
                + event.projectTitle() + "\"";
        String body = """
                %s

                Proyecto: %s
                Fecha: %s
                Hora: %s
                Lugar: %s%s%s

                Cátedra UNISIMÓN INNPRENDE · MacondoLab
                """.formatted(
                        event.rescheduled()
                                ? "La sustentación de tu proyecto cambió de fecha, hora o lugar. Estos son los datos nuevos:"
                                : "Ya está programada la sustentación de tu proyecto.",
                        event.projectTitle(),
                        formatDate(event.startsAt()),
                        formatTime(event.startsAt()),
                        event.place(),
                        event.notes() == null || event.notes().isBlank() ? "" : "\nIndicaciones: " + event.notes(),
                        appLink(null));
        for (String recipient : event.recipients()) {
            deliver(recipient, subject, body);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEvaluationReminder(EvaluationReminderEvent event) {
        String subject = "Tienes proyectos por calificar";
        String list = event.projectTitles().stream().map(title -> "- " + title).collect(Collectors.joining("\n"));
        String body = """
                Hola, %s.

                Te falta calificar con la rúbrica:
                %s

                Entra a Idearium y, en Evaluar, abre cada proyecto para calificarlo.%s

                Cátedra UNISIMÓN INNPRENDE · MacondoLab
                """.formatted(event.fullName(), list, appLink("/jurado/proyectos"));
        deliver(event.email(), subject, body);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onEmailVerification(EmailVerificationEvent event) {
        String subject = "Verifica tu correo en Idearium";
        String body = """
                Hola, %s.

                Para terminar de crear tu cuenta en Idearium, abre este enlace:%s

                El enlace vale 48 horas y sirve una sola vez. Si no creaste la cuenta, ignora este correo: sin abrir el enlace, nadie puede usarla.

                Cátedra UNISIMÓN INNPRENDE · MacondoLab
                """.formatted(event.fullName(), appLink("/verificar-correo#token=" + event.token()));
        deliver(event.email(), subject, body);
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onPasswordRecovery(PasswordRecoveryEvent event) {
        String subject = "Recupera tu contraseña de Idearium";
        String body = """
                Hola, %s.

                Alguien pidió cambiar la contraseña de tu cuenta en Idearium. Si fuiste tú, abre este enlace para poner una nueva:%s

                El enlace vale una hora y sirve una sola vez. Si no lo pediste, ignora este correo: tu contraseña sigue siendo la misma.

                Cátedra UNISIMÓN INNPRENDE · MacondoLab
                """.formatted(event.fullName(), appLink("/restablecer-contrasena#token=" + event.token()));
        deliver(event.email(), subject, body);
    }

    private void deliver(String to, String subject, String body) {
        try {
            mailService.send(to, subject, body);
        } catch (RuntimeException e) {
            // La operación ya se confirmó; el aviso perdido se ve en el log, no en la respuesta.
            log.error("No se pudo enviar \"{}\" a {}: {}", subject, to, e.getMessage());
        }
    }

    /** Un enlace a la plataforma, si se conoce su URL pública (APP_URL). */
    private String appLink(String path) {
        String url = properties.appUrl();
        if (url == null || url.isBlank()) {
            return "";
        }
        String base = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        return "\n\n" + base + (path == null ? "" : path);
    }

    static String formatDate(LocalDateTime when) {
        String text = DATE.format(when);
        return Character.toUpperCase(text.charAt(0)) + text.substring(1);
    }

    static String formatTime(LocalDateTime when) {
        // CLDR separa "p. m." con un espacio duro; en un correo de texto plano se lee mejor uno normal.
        return TIME.format(when).toLowerCase(SPANISH).replace(' ', ' ').replace(' ', ' ');
    }
}

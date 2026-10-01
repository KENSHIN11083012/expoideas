package co.edu.unisimon.expoideas.notifications;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import co.edu.unisimon.expoideas.support.TestData;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailSendException;

/** Qué pasa con un correo cuando el servidor falla: se reintenta y, si no sale, queda en el rastro. */
@ExtendWith(MockitoExtension.class)
class NotificationListenerTest {

    private static final String ANA = "ana@unisimon.edu.co";
    private static final String SUBJECT = "Tu cuenta en Idearium";

    @Mock
    private MailService mailService;

    @Mock
    private MailFailureRecorder failures;

    private NotificationListener listener;

    @BeforeEach
    void setUp() {
        // Tres intentos y sin espera entre ellos (TestData).
        listener = new NotificationListener(mailService, TestData.properties(Path.of("x")), failures);
    }

    @Test
    void aServerThatFailsForAMomentDoesNotCostTheMail() {
        MailSendException down = new MailSendException("SMTP caído");
        doThrow(down).doThrow(down).doNothing().when(mailService).send(eq(ANA), eq(SUBJECT), anyString());

        listener.onAccountCreated(account());

        verify(mailService, times(3)).send(eq(ANA), eq(SUBJECT), anyString());
        verify(failures, never()).record(anyString(), anyString(), anyInt(), any());
    }

    @Test
    void afterTheLastAttemptTheLostMailIsLeftInTheAuditTrail() {
        MailSendException down = new MailSendException("SMTP caído");
        doThrow(down).when(mailService).send(eq(ANA), eq(SUBJECT), anyString());

        assertThatCode(() -> listener.onAccountCreated(account())).doesNotThrowAnyException();

        verify(mailService, times(3)).send(eq(ANA), eq(SUBJECT), anyString());
        verify(failures).record(ANA, SUBJECT, 3, down);
    }

    @Test
    void whatAnotherAttemptWouldNotFixIsNotRetried() {
        MailAuthenticationException rejected = new MailAuthenticationException("535 credenciales inválidas");
        doThrow(rejected).when(mailService).send(eq(ANA), eq(SUBJECT), anyString());

        listener.onAccountCreated(account());

        verify(mailService, times(1)).send(eq(ANA), eq(SUBJECT), anyString());
        verify(failures).record(ANA, SUBJECT, 1, rejected);
    }

    @Test
    void oneRecipientFailingDoesNotStopTheOthers() {
        String carlos = "carlos@unisimon.edu.co";
        MailSendException down = new MailSendException("buzón inexistente");
        doThrow(down).when(mailService).send(eq(ANA), anyString(), anyString());
        doNothing().when(mailService).send(eq(carlos), anyString(), anyString());

        listener.onPresentationScheduled(new PresentationScheduledEvent(
                List.of(ANA, carlos), "BioSensor", LocalDateTime.of(2026, 11, 20, 9, 30), "Auditorio", null, false));

        verify(mailService, times(1)).send(eq(carlos), anyString(), anyString());
        verify(failures).record(eq(ANA), eq("Sustentación programada: \"BioSensor\""), eq(3), eq(down));
        verify(failures, never()).record(eq(carlos), anyString(), anyInt(), any());
    }

    @Test
    void ifTheTrailCannotBeWrittenEitherNothingBreaks() {
        doThrow(new MailSendException("SMTP caído")).when(mailService).send(anyString(), anyString(), anyString());
        doThrow(new IllegalStateException("la base no responde"))
                .when(failures)
                .record(anyString(), anyString(), anyInt(), any());

        assertThatCode(() -> listener.onAccountCreated(account())).doesNotThrowAnyException();
    }

    private static AccountCreatedEvent account() {
        return new AccountCreatedEvent(ANA, "Ana Pérez", "Temporal#2026", "Jurado");
    }
}

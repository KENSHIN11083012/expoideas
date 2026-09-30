package co.edu.unisimon.expoideas.notifications;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import co.edu.unisimon.expoideas.support.TestData;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

/** Sin SMTP no pasa nada; con SMTP el correo sale con el remitente configurado; si falla, no rompe. */
class MailServiceTest {

    @SuppressWarnings("unchecked")
    private static ObjectProvider<JavaMailSender> provider(JavaMailSender sender) {
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        return provider;
    }

    @Test
    void withoutAMailServerNothingIsSentAndNothingBreaks() {
        MailService service = new MailService(provider(null), TestData.properties(Path.of("x")));

        assertThat(service.isConfigured()).isFalse();
        assertThatCode(() -> service.send("ana@unisimon.edu.co", "Hola", "Cuerpo"))
                .doesNotThrowAnyException();
    }

    @Test
    void sendsPlainTextFromTheConfiguredSender() {
        JavaMailSender sender = mock(JavaMailSender.class);
        MailService service = new MailService(provider(sender), TestData.properties(Path.of("x")));

        service.send("ana@unisimon.edu.co", "Hola", "Cuerpo");

        ArgumentCaptor<SimpleMailMessage> message = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(sender).send(message.capture());
        assertThat(message.getValue().getFrom()).isEqualTo("expoideas@pruebas.local");
        assertThat(message.getValue().getTo()).containsExactly("ana@unisimon.edu.co");
        assertThat(message.getValue().getSubject()).isEqualTo("Hola");
        assertThat(message.getValue().getText()).isEqualTo("Cuerpo");
    }

    @Test
    void aFailedDeliveryIsLoggedAndSwallowedByTheListener() {
        JavaMailSender sender = mock(JavaMailSender.class);
        doThrow(new MailSendException("SMTP caído")).when(sender).send(any(SimpleMailMessage.class));
        NotificationListener listener = new NotificationListener(
                new MailService(provider(sender), TestData.properties(Path.of("x"))),
                TestData.properties(Path.of("x")));

        assertThatCode(() -> listener.onPresentationScheduled(new PresentationScheduledEvent(
                        List.of("ana@unisimon.edu.co", "carlos@unisimon.edu.co"),
                        "BioSensor",
                        LocalDateTime.of(2026, 11, 20, 9, 30),
                        "Auditorio",
                        null,
                        false)))
                .doesNotThrowAnyException();
        // Se intentó con los dos destinatarios: el fallo del primero no frena al segundo.
        verify(sender, org.mockito.Mockito.times(2)).send(any(SimpleMailMessage.class));
    }

    @Test
    void datesReadNaturallyInSpanish() {
        LocalDateTime when = LocalDateTime.of(2026, 11, 20, 14, 5);

        assertThat(NotificationListener.formatDate(when)).isEqualTo("Viernes 20 de noviembre de 2026");
        assertThat(NotificationListener.formatTime(when)).isEqualTo("2:05 p. m.");
    }
}

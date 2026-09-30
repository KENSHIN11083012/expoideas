package co.edu.unisimon.expoideas.notifications;

import co.edu.unisimon.expoideas.common.ExpoideasProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Envío de correos en texto plano. El servidor SMTP llega por las variables
 * {@code SPRING_MAIL_*}; sin él, Spring no crea el {@link JavaMailSender} y aquí
 * solo queda constancia en el log: la plataforma funciona igual, sin avisos.
 *
 * <p>Quien llama decide qué hacer si el envío falla; {@link NotificationListener}
 * lo registra y sigue, porque un aviso perdido no debe deshacer la operación.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> senders;
    private final ExpoideasProperties properties;

    /** Si hay un servidor de correo configurado. */
    public boolean isConfigured() {
        return senders.getIfAvailable() != null;
    }

    /**
     * Envía un correo. Si no hay servidor configurado, no hace nada más que avisar en el log.
     *
     * @throws org.springframework.mail.MailException si el servidor rechaza el envío
     */
    public void send(String to, String subject, String body) {
        JavaMailSender sender = senders.getIfAvailable();
        if (sender == null) {
            log.warn("Sin servidor de correo configurado: no se envía \"{}\" a {}", subject, to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mail().from());
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        sender.send(message);
        log.info("Correo \"{}\" enviado a {}", subject, to);
    }
}

package co.edu.unisimon.expoideas.common;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Habilita {@code @Async}: los correos salen en otro hilo, después del commit,
 * para que quien pidió la operación no espere al servidor SMTP.
 */
@Configuration
@EnableAsync
public class AsyncConfig {}

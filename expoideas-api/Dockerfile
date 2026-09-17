# syntax=docker/dockerfile:1
# API de Expoideas. Compila con el JDK y corre solo con el JRE, como usuario sin
# privilegios. Las pruebas corren en la integración continua, no aquí.

FROM eclipse-temurin:25-jdk AS construccion
WORKDIR /fuente

# Dependencias primero: esta capa se reutiliza mientras el pom no cambie.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q -DskipTests package \
    && cp target/expoideas-api-*.jar /app.jar


FROM eclipse-temurin:25-jre

RUN groupadd --system expoideas \
    && useradd --system --gid expoideas --home-dir /app --no-create-home expoideas \
    && mkdir -p /app /data/archivos \
    && chown expoideas:expoideas /data/archivos

WORKDIR /app
COPY --from=construccion /app.jar app.jar

ENV SPRING_PROFILES_ACTIVE=prod \
    ARCHIVOS_DIR=/data/archivos \
    JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"

# Los archivos subidos deben sobrevivir a una actualización de la imagen.
VOLUME /data/archivos

USER expoideas
EXPOSE 8080

# La imagen no trae curl: la comprobación usa bash contra el endpoint de readiness.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=4 \
    CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080 && printf "GET /actuator/health/readiness HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3 && grep -q "\"UP\"" <&3'

ENTRYPOINT ["java", "-jar", "app.jar"]

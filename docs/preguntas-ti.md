# Preguntas para TI: despliegue de Idearium (antes Expoideas)

Idearium debe estar en producción para abrir las inscripciones de INNPRENDE I y II alrededor
del **3 de noviembre de 2026**. Para preparar el despliegue a tiempo necesitamos confirmar lo
siguiente. La arquitectura propuesta está en [despliegue.md](despliegue.md).

Cada pregunta lleva su respuesta y lo que depende de ella. Cuando TI responda, se anota aquí la
respuesta con su fecha y quién la dio.

**Estado al 1 de octubre de 2026:** ninguna de las 16 tiene respuesta registrada. Lo único que TI
ha dicho es que por ahora no entrega el listado de la cátedra (ver [listado.md](listado.md)).

## Las que frenan la salida a producción

Sin estas no hay fecha: de las demás se puede salir con el valor por defecto y ajustar después.

| # | Qué falta saber | Por qué frena |
|---|---|---|
| 1, 2 | El servidor y si admite Docker | Decide cuál de los dos caminos de instalación se sigue y cuánta memoria se le da a cada servicio |
| 3, 15 | Quién despliega y con cuánta antelación | Con la fecha del 3 de noviembre, hay que saber cuándo entregar la versión |
| 5, 6 | La URL pública y quién pone el HTTPS | Sin HTTPS no se sale: las contraseñas viajarían sin cifrar. La URL también va en los enlaces de los correos |
| 9, 10 | Quién saca las copias del servidor | La plataforma ya hace la copia; no sirve si se queda en el mismo disco |
| 16 | Políticas de protección de datos | Se guardan datos personales de estudiantes |

## Servidor

1. ¿En qué servidor se desplegará (sistema operativo, CPU, RAM y disco disponibles)?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** los topes de memoria de cada servicio. Por defecto suman cerca de 2 GB
     (MySQL 1 GB, API 768 MB, Nginx 128 MB) y se ajustan en el `.env`.

2. ¿Se puede usar **Docker con Docker Compose**? Si no, ¿se permite Java 25 y un Nginx/Apache
   para servir la app?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** con Docker se sigue la opción A de [despliegue.md](despliegue.md), que es
     la probada: un comando levanta todo, y las copias y su restauración tienen scripts. Sin
     Docker se sigue la opción B, a mano; los scripts de copia no aplican y las pruebas de punta
     a punta no cubren esa instalación.

3. ¿Quién ejecuta los despliegues y las actualizaciones? ¿Tendremos acceso al servidor o se hace
   por solicitud a TI?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** si lo hace TI, hay que entregarle el procedimiento (ya está en
     [despliegue.md](despliegue.md)) y acordar cómo pide una actualización urgente. El primer
     administrador se crea con una sentencia SQL: alguien con acceso al servidor tiene que
     ejecutarla.

4. ¿Hay un servidor de pruebas donde validar antes de producción?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** si lo hay, ahí se hace el piloto y la prueba de restauración. Si no, la
     instalación de prueba se levanta en el mismo servidor con otro nombre y otro puerto, como
     explica [despliegue.md](despliegue.md#copias-de-seguridad).

## Dominio y red

5. ¿Cuál será la URL pública? Proponemos una ruta bajo un dominio institucional, por ejemplo
   `https://<dominio>.unisimon.edu.co/expoideas/`.

   - **Respuesta:** sin respuesta.
   - **Qué depende:** la variable `APP_URL`, que arma los enlaces de los correos. Sin ella no se
     activa la verificación del correo ni «Olvidé mi contraseña». La ruta `/expoideas/` está fija
     en la app: otra ruta obliga a reconstruir la imagen.

6. ¿El certificado HTTPS lo pone un proxy o balanceador de TI? ¿Reenvía las cabeceras
   `X-Forwarded-Proto` y `X-Forwarded-Host`?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** la plataforma no termina HTTPS: espera un proxy delante. Además del
     esquema y el host, el freno a los intentos de inicio de sesión cuenta por la dirección que
     ese proxy pone en `X-Forwarded-For`: sin proxy, esa cabecera la escribe quien quiera y el
     freno se puede esquivar.

7. ¿Qué puerto interno podemos usar para la app y qué reglas de firewall aplican?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** la variable `HTTP_PORT` (por defecto 8080). Solo la app publica puerto;
     MySQL y la API quedan en la red interna de Docker.

## Base de datos

8. ¿MySQL lo provee TI (servidor administrado) o va en un contenedor junto a la aplicación?
   Requerimos MySQL 8.4 con utf8mb4.

   - **Respuesta:** sin respuesta.
   - **Qué depende:** por defecto va en un contenedor. Si lo provee TI, se quita ese servicio
     del Compose y se apunta `DB_URL` a su servidor; entonces la copia de la base la hace TI y
     `scripts/copia.sh` no aplica tal como está.

9. ¿Quién respalda la base de datos, con qué frecuencia y cuánto tiempo se guardan las copias?

   - **Respuesta:** sin respuesta.
   - **Qué depende:** la plataforma trae `scripts/copia.sh`, que saca la base y los archivos
     juntos en un paquete y se puede programar cada noche, y `scripts/restaurar.sh`, probado. Lo
     que falta es de TI: a dónde se lleva ese paquete fuera del servidor, cuántos se conservan y
     quién revisa que la copia se hizo.

## Archivos subidos

10. ¿Dónde se guardan los archivos (fotos, pósteres, evidencias; máximo 5 MB cada uno)?
    Estimamos unos **10 GB por semestre**, suponiendo del orden de 200 proyectos con póster, fotos
    y evidencias (cifra a confirmar con MacondoLab). Necesitamos que entren en las copias de
    seguridad junto con la base de datos.

    - **Respuesta:** sin respuesta.
    - **Qué depende:** por defecto van en un volumen de Docker en el mismo servidor, y la copia
      ya los incluye. Si TI da otro almacenamiento, se monta en lugar de ese volumen.

11. ¿TI exige análisis antivirus de los archivos subidos? La plataforma ya valida tipo y tamaño
    por el contenido real.

    - **Respuesta:** sin respuesta.
    - **Qué depende:** no está construido. Si se exige, hay que añadirlo (por ejemplo ClamAV
      sobre la carpeta de archivos) y decidir qué pasa con un archivo marcado.

## Servicios de la universidad

12. ¿Hay un servidor de correo (SMTP) que podamos usar para los avisos de la plataforma
    (invitaciones a equipos, cuentas creadas por la gestión, fecha y lugar de las sustentaciones)?
    Necesitamos host, puerto, si exige STARTTLS, usuario y contraseña, y una dirección remitente
    autorizada (proponemos `no-reply@unisimon.edu.co`). ¿Hay un límite de correos por hora? Estimamos
    del orden de cientos por semestre, con picos el día en que se programan las sustentaciones.

    - **Respuesta:** sin respuesta.
    - **Qué depende:** sin SMTP la plataforma funciona, pero no avisa de nada, el registro no
      comprueba que el correo sea de quien se registra, el rol de profesor del listado lo tiene
      que confirmar la gestión y las contraseñas olvidadas las restablece la gestión. Con SMTP y
      `APP_URL` todo eso se activa solo. A la lista de avisos se sumaron dos correos: el enlace
      de verificación al registrarse y el de recuperación de contraseña; con ellos el volumen
      sube a uno por cada cuenta nueva.

13. A futuro: ¿es posible integrarse con el inicio de sesión institucional (Microsoft 365/Entra
    ID) o con el aula virtual? ¿Qué permisos y trámites implica?

    - **Respuesta:** sin respuesta.
    - **Qué depende:** nada del piloto. Con inicio de sesión institucional sobrarían las
      contraseñas propias, la verificación del correo y la recuperación.

## Operación y plazos

14. ¿Qué monitoreo y manejo de logs usa TI? La API expone `/actuator/health` para eso.

    - **Respuesta:** sin respuesta.
    - **Qué depende:** hoy los tres servicios tienen comprobación de salud en Docker y los logs
      salen por la salida estándar, con rotación. Si TI tiene un sistema de monitoreo, hay que
      publicarle la comprobación de salud, que Nginx hoy no expone.

15. ¿Cuánto tiempo necesita TI desde que entregamos la versión hasta tenerla publicada?
    ¿Hay ventanas de mantenimiento o fechas en las que no se puede desplegar?

    - **Respuesta:** sin respuesta.
    - **Qué depende:** la fecha en la que hay que entregar para llegar al 3 de noviembre.

16. ¿Hay políticas de seguridad o de protección de datos (Ley 1581) que debamos cumplir o
    documentar antes de salir a producción?

    - **Respuesta:** sin respuesta.
    - **Qué depende:** hoy cada persona autoriza el tratamiento de sus datos al registrarse o en
      su primer ingreso, queda la fecha, y hay rastro de quién cambió roles, contraseñas y notas.
      No está construido que una persona pida exportar o borrar sus datos, ni se guarda qué
      versión del texto aceptó. Si la universidad exige algo de eso, o un texto de autorización
      propio, hay que saberlo antes de abrir.

# Preguntas para TI: despliegue de Expoideas

Expoideas debe estar en producción para abrir las inscripciones de INNPRENDE I y II alrededor
del **3 de noviembre de 2026**. Para preparar el despliegue a tiempo necesitamos confirmar lo
siguiente. La arquitectura propuesta está en [despliegue.md](despliegue.md).

## Servidor

1. ¿En qué servidor se desplegará (sistema operativo, CPU, RAM y disco disponibles)?
2. ¿Se puede usar **Docker con Docker Compose**? Si no, ¿se permite Java 25 y un Nginx/Apache
   para servir la app?
3. ¿Quién ejecuta los despliegues y las actualizaciones? ¿Tendremos acceso al servidor o se hace
   por solicitud a TI?
4. ¿Hay un servidor de pruebas donde validar antes de producción?

## Dominio y red

5. ¿Cuál será la URL pública? Proponemos una ruta bajo un dominio institucional, por ejemplo
   `https://<dominio>.unisimon.edu.co/expoideas/`.
6. ¿El certificado HTTPS lo pone un proxy o balanceador de TI? ¿Reenvía las cabeceras
   `X-Forwarded-Proto` y `X-Forwarded-Host`?
7. ¿Qué puerto interno podemos usar para la app y qué reglas de firewall aplican?

## Base de datos

8. ¿MySQL lo provee TI (servidor administrado) o va en un contenedor junto a la aplicación?
   Requerimos MySQL 8.4 con utf8mb4.
9. ¿Quién respalda la base de datos, con qué frecuencia y cuánto tiempo se guardan las copias?

## Archivos subidos

10. ¿Dónde se guardan los archivos (fotos, pósteres, evidencias; máximo 5 MB cada uno)?
    Estimamos unos **10 GB por semestre**, suponiendo del orden de 200 proyectos con póster, fotos
    y evidencias (cifra a confirmar con MacondoLab). Necesitamos que entren en las copias de
    seguridad junto con la base de datos.
11. ¿TI exige análisis antivirus de los archivos subidos? La plataforma ya valida tipo y tamaño
    por el contenido real.

## Servicios de la universidad

12. ¿Hay un servidor de correo (SMTP) que podamos usar para notificaciones y recuperación de
    contraseña?
13. A futuro: ¿es posible integrarse con el inicio de sesión institucional (Microsoft 365/Entra
    ID) o con el aula virtual? ¿Qué permisos y trámites implica?

## Operación y plazos

14. ¿Qué monitoreo y manejo de logs usa TI? La API expone `/actuator/health` para eso.
15. ¿Cuánto tiempo necesita TI desde que entregamos la versión hasta tenerla publicada?
    ¿Hay ventanas de mantenimiento o fechas en las que no se puede desplegar?
16. ¿Hay políticas de seguridad o de protección de datos (Ley 1581) que debamos cumplir o
    documentar antes de salir a producción?

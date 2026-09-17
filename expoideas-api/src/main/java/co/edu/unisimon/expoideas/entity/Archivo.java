package co.edu.unisimon.expoideas.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Metadatos de un archivo subido. El contenido está en el almacenamiento
 * (ver {@code archivos.AlmacenamientoArchivos}), en {@link #ruta}.
 *
 * <p>Sin @Data a propósito: equals/hashCode/toString sobre relaciones lazy
 * cargarían al propietario (y su foto) por accidente.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "archivos")
public class Archivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Identificador público: es lo único que sale por la API y aparece en las URL. */
    @Column(name = "uuid", nullable = false, unique = true, length = 36)
    private String uuid;

    /** Nombre con el que se subió, ya saneado; solo se usa al descargar. */
    @Column(name = "nombre_original", nullable = false, length = 255)
    private String nombreOriginal;

    /** Tipo detectado por el contenido del archivo, no el que declaró el navegador. */
    @Column(name = "tipo_contenido", nullable = false, length = 100)
    private String tipoContenido;

    @Column(name = "tamano_bytes", nullable = false)
    private Integer tamanoBytes;

    @Column(name = "sha256", nullable = false, length = 64)
    private String sha256;

    /** Ubicación dentro del almacenamiento. Nunca sale por la API. */
    @Column(name = "ruta", nullable = false, unique = true, length = 255)
    private String ruta;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibilidad", nullable = false, length = 20)
    private VisibilidadArchivo visibilidad;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_propietario", nullable = false)
    private Usuario propietario;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    protected void onCreate() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }
}

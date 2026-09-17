package co.edu.unisimon.expoideas.controller;

import co.edu.unisimon.expoideas.archivos.ContenidoArchivo;
import co.edu.unisimon.expoideas.security.JwtService;
import co.edu.unisimon.expoideas.security.SecurityConfig;
import co.edu.unisimon.expoideas.service.ArchivoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.NoSuchElementException;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ArchivoController.class)
@Import(SecurityConfig.class)
class ArchivoControllerTest {

    private static final byte[] PNG = { (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
    private static final UUID ID = UUID.fromString("0b0f3f7e-8c1a-4c55-9d3e-2f1a6b7c8d9e");
    private static final String SHA = "a".repeat(64);

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean private ArchivoService archivoService;
    @MockitoBean private JwtService jwtService;
    @MockitoBean private UserDetailsService userDetailsService;

    private void existe(boolean publico) {
        when(archivoService.abrir(eq(ID), any())).thenReturn(new ContenidoArchivo(
                "mi foto.png", "image/png", PNG.length, SHA, publico, new ByteArrayResource(PNG)));
    }

    @Test
    void unArchivoPublicoSeDescargaSinSesionYConCacheLarga() throws Exception {
        existe(true);

        mockMvc.perform(get("/api/v1/archivos/" + ID))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(PNG))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("max-age=31536000")))
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("immutable")))
                .andExpect(header().string(HttpHeaders.ETAG, "\"" + SHA + "\""))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("inline")))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("filename*=UTF-8''mi%20foto.png")))
                .andExpect(header().string("Content-Security-Policy", "default-src 'none'; sandbox"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    void siElNavegadorYaLoTieneResponde304() throws Exception {
        existe(true);

        mockMvc.perform(get("/api/v1/archivos/" + ID).header(HttpHeaders.IF_NONE_MATCH, "\"" + SHA + "\""))
                .andExpect(status().isNotModified());
    }

    @Test
    void unArchivoPrivadoNoSeGuardaEnCache() throws Exception {
        existe(false);

        mockMvc.perform(get("/api/v1/archivos/" + ID))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, containsString("no-store")));
    }

    @Test
    void sinPermisoONoExisteEs404() throws Exception {
        when(archivoService.abrir(eq(ID), any())).thenThrow(new NoSuchElementException("El archivo no existe"));

        mockMvc.perform(get("/api/v1/archivos/" + ID))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.detail").value("El archivo no existe"));
    }

    @Test
    void unIdentificadorMalFormadoEs400() throws Exception {
        mockMvc.perform(get("/api/v1/archivos/../../etc/passwd"))
                .andExpect(status().is4xxClientError());
        mockMvc.perform(get("/api/v1/archivos/no-es-un-uuid"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(archivoService);
    }
}

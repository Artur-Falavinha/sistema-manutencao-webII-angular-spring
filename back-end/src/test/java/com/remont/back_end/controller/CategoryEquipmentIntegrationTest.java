package com.remont.back_end.controller;

import com.jayway.jsonpath.JsonPath;
import com.remont.back_end.model.CategoryEquipment;
import com.remont.back_end.model.User;
import com.remont.back_end.repository.CategoryEquipmentRepository;
import com.remont.back_end.repository.UserRepository;
import com.remont.back_end.security.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * RF017: Testes de integracao e regressao do CRUD de categorias de equipamento
 * com dados ativos e inativos sobre o banco inicializado pelo data.sql.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CategoryEquipmentIntegrationTest {

    private static final String CLIENT_EMAIL = "joao@gmail.com";
    private static final String EMPLOYEE_EMAIL = "maria@remont.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryEquipmentRepository categoryRepository;

    private String clientToken;
    private String employeeToken;

    @BeforeEach
    void issueTokens() {
        clientToken = tokenFor(CLIENT_EMAIL);
        employeeToken = tokenFor(EMPLOYEE_EMAIL);
    }

    @Test
    void listAllCategoriesReturnsInitialActiveCategories() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Notebook")))
                .andExpect(jsonPath("$[*].name", hasItem("Desktop")))
                .andExpect(jsonPath("$[*].name", hasItem("Impressora")))
                .andExpect(jsonPath("$[*].name", hasItem("Mouse")))
                .andExpect(jsonPath("$[*].name", hasItem("Teclado")));
    }

    @Test
    void getCategoryByIdReturnsExistingAnd404WhenNotFound() throws Exception {
        mockMvc.perform(get("/api/categories/1")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Notebook"))
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(get("/api/categories/99999")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Categoria não encontrada")));
    }

    @Test
    void employeeCreatesAndUpdatesCategoryEndToEnd() throws Exception {
        String createBody = """
                {"name":"Monitor Ultrawide","icon":"monitor"}
                """;

        String createdJson = mockMvc.perform(post("/api/categories")
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/categories/")))
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Monitor Ultrawide"))
                .andExpect(jsonPath("$.icon").value("monitor"))
                .andExpect(jsonPath("$.active").value(true))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Integer id = JsonPath.read(createdJson, "$.id");

        String updateBody = """
                {"name":"Monitor Gamer 144Hz","icon":"tv"}
                """;

        mockMvc.perform(put("/api/categories/" + id)
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.name").value("Monitor Gamer 144Hz"))
                .andExpect(jsonPath("$.icon").value("tv"))
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(get("/api/categories/" + id)
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Monitor Gamer 144Hz"));
    }

    @Test
    void logicalDeletionMarksCategoryInactiveAndHidesFromActiveList() throws Exception {
        String createdJson = mockMvc.perform(post("/api/categories")
                        .header("Authorization", bearer(employeeToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Scanner de Mesa\",\"icon\":\"scanner\"}"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        Integer id = JsonPath.read(createdJson, "$.id");

        mockMvc.perform(delete("/api/categories/" + id)
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isNoContent());

        CategoryEquipment persisted = categoryRepository.findById(id).orElseThrow();
        assertThat(persisted.isActive()).isFalse();

        mockMvc.perform(get("/api/categories")
                        .header("Authorization", bearer(employeeToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", not(hasItem("Scanner de Mesa"))));
    }

    @Test
    void clientRoleCannotCreateUpdateOrDeleteCategory() throws Exception {
        mockMvc.perform(post("/api/categories")
                        .header("Authorization", bearer(clientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Proibida\",\"icon\":\"block\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/categories/1")
                        .header("Authorization", bearer(clientToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Notebook Editado\",\"icon\":\"laptop\"}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/categories/1")
                        .header("Authorization", bearer(clientToken)))
                .andExpect(status().isForbidden());
    }

    private String tokenFor(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Usuário de teste ausente: " + email));
        return tokenService.generateToken(user);
    }

    private static String bearer(String token) {
        return "Bearer " + token;
    }
}

package com.remont.back_end;

import com.remont.back_end.repository.CategoryEquipmentRepository;
import com.remont.back_end.repository.MaintenanceRequestRepository;
import com.remont.back_end.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseInitializationTest {

    @Autowired
    private CategoryEquipmentRepository categoryRepository;

    @Autowired
    private MaintenanceRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void contextLoads() {
        // Valida que o contexto Spring sobe sem quebrar dependências
        assertThat(categoryRepository).isNotNull();
        assertThat(requestRepository).isNotNull();
        assertThat(userRepository).isNotNull();
    }

    @Test
    void databaseShouldInitializeWithRelevantData() {
        // A inicialização de teste executa data.sql e a carga de demonstração separada.
        
        // Verifica cadastros base
        assertThat(userRepository.count()).isGreaterThanOrEqualTo(7);
        assertThat(categoryRepository.count()).isGreaterThanOrEqualTo(5);
        
        // Verifica se os dados de negócio (transacionais) foram injetados com sucesso
        assertThat(requestRepository.count()).isGreaterThanOrEqualTo(3); 
    }

    @Test
    void separateDemoSeedHasTheTestRequestsRequiredByTheAssignment() {
        // Enunciado: pelo menos 20 solicitações, com estados, datas, clientes e funcionários diferentes e histórico.
        assertThat(seedCount("SELECT COUNT(*) FROM maintenance_requests WHERE id <= 24")).isEqualTo(24);
        assertThat(seedCount("SELECT COUNT(DISTINCT status) FROM maintenance_requests WHERE id <= 24")).isEqualTo(8);
        assertThat(seedCount("SELECT COUNT(DISTINCT client_id) FROM maintenance_requests WHERE id <= 24")).isEqualTo(4);
        assertThat(seedCount("SELECT COUNT(DISTINCT employee_id) FROM maintenance_requests WHERE id <= 24")).isEqualTo(2);
        assertThat(seedCount("SELECT COUNT(DISTINCT category_id) FROM maintenance_requests WHERE id <= 24")).isEqualTo(5);

        // Registros ligados: orçamentos, serviços do orçamento, manutenções e histórico de todas as solicitações.
        assertThat(seedCount("SELECT COUNT(*) FROM budgets WHERE id <= 18")).isEqualTo(18);
        assertThat(seedCount("SELECT COUNT(*) FROM servicos_orcamento WHERE id <= 36")).isEqualTo(36);
        assertThat(seedCount("SELECT COUNT(*) FROM maintenance_records WHERE id <= 9")).isEqualTo(9);
        assertThat(seedCount("SELECT COUNT(*) FROM request_history WHERE id <= 83")).isEqualTo(83);
        assertThat(seedCount("SELECT COUNT(DISTINCT request_id) FROM request_history WHERE id <= 83")).isEqualTo(24);

        // O total de cada orçamento é a soma dos serviços vinculados.
        assertThat(seedCount("""
                SELECT COUNT(*) FROM budgets b
                WHERE b.id <= 18 AND b.total <> (
                    SELECT SUM(s.valor_servico) FROM servicos_orcamento so
                    JOIN services s ON s.id = so.servico_id
                    WHERE so.orcamento_id = b.id)
                """)).isZero();
    }

    private Integer seedCount(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }
}

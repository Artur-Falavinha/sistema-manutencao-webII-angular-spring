package com.remont.back_end;

import com.remont.back_end.repository.CategoryEquipmentRepository;
import com.remont.back_end.repository.MaintenanceRequestRepository;
import com.remont.back_end.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DatabaseInitializationTest {

    @Autowired
    private CategoryEquipmentRepository categoryRepository;

    @Autowired
    private MaintenanceRequestRepository requestRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void contextLoads() {
        // Valida que o contexto Spring sobe sem quebrar dependências
        assertThat(categoryRepository).isNotNull();
        assertThat(requestRepository).isNotNull();
        assertThat(userRepository).isNotNull();
    }

    @Test
    void databaseShouldInitializeWithRelevantData() {
        // Critério de aceitação: Banco inicia com dados relevantes do data.sql
        
        // Verifica cadastros base
        assertThat(userRepository.count()).isGreaterThanOrEqualTo(7);
        assertThat(categoryRepository.count()).isGreaterThanOrEqualTo(5);
        
        // Verifica se os dados de negócio (transacionais) foram injetados com sucesso
        assertThat(requestRepository.count()).isGreaterThanOrEqualTo(3); 
    }
}
package com.remont.back_end.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(name = "app.defense.seed", havingValue = "true")
public class DefenseDataInitializer implements ApplicationRunner {
    private final JdbcTemplate jdbc;

    public DefenseDataInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Integer markerTable = jdbc.queryForObject("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = 'defense_initialization'
                """, Integer.class);
        if (markerTable == 0 || jdbc.queryForList(
                "SELECT id FROM defense_initialization WHERE id = 1 FOR UPDATE", Integer.class).isEmpty()) {
            return;
        }

        if (jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class) == 0) {
            jdbc.execute((ConnectionCallback<Void>) connection -> {
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("data-defesa.sql"));
                ScriptUtils.executeSqlScript(connection, new ClassPathResource("data-demo.sql"));
                return null;
            });
        }
        jdbc.update("DELETE FROM defense_initialization WHERE id = 1");
    }
}

package com.remont.back_end.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

@Component
@ConditionalOnProperty(name = "app.defense.seed", havingValue = "true")
public class DefenseDataInitializer implements ApplicationRunner {
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;

    public DefenseDataInitializer(JdbcTemplate jdbc, TransactionTemplate transaction) {
        this.jdbc = jdbc;
        this.transaction = transaction;
    }

    @Override
    public void run(ApplicationArguments args) {
        transaction.executeWithoutResult(status -> {
            boolean empty = Boolean.TRUE.equals(jdbc.queryForObject("""
                    SELECT NOT EXISTS (SELECT 1 FROM users)
                       AND NOT EXISTS (SELECT 1 FROM category)
                       AND NOT EXISTS (SELECT 1 FROM services)
                    """, Boolean.class));
            if (empty) {
                jdbc.execute((ConnectionCallback<Void>) connection -> {
                    ScriptUtils.executeSqlScript(connection, new ClassPathResource("data-defesa.sql"));
                    ScriptUtils.executeSqlScript(connection, new ClassPathResource("data-demo.sql"));
                    return null;
                });
            }
        });

        // MySQL commits implicitly on DROP TABLE, so clean up only after the seed transaction.
        jdbc.execute("DROP TABLE IF EXISTS defense_initialization");
    }
}

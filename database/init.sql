CREATE DATABASE IF NOT EXISTS remont_db;
GRANT ALL PRIVILEGES ON remont_db.* TO 'springuser'@'%';
FLUSH PRIVILEGES;

USE remont_db;

CREATE TABLE IF NOT EXISTS defense_initialization (
    id TINYINT PRIMARY KEY
);
INSERT IGNORE INTO defense_initialization (id) VALUES (1);

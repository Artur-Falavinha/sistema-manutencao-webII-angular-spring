INSERT IGNORE INTO category (id, name, icon, active) VALUES
(1, 'Notebook', 'laptop', 1),
(2, 'Desktop', 'computer', 1),
(3, 'Impressora', 'printer', 1),
(4, 'Mouse', 'mouse', 1),
(5, 'Teclado', 'keyboard', 1);

-- Admin (Senha: 9876)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (1, 'Admin', 'admin@remont.com', 'v8HE2LXv/pO01KY6YD/9Ng==$F+AHe/3jYWuxf7KYlxH6YtCfZkSmDAJDYgA4m/tDfQc=', 'ROLE_EMPLOYEE');

-- Funcionários (Senha: 4321)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (2, 'Maria', 'maria@remont.com', 'PycDJLjUpDWA4rckoxXHnQ==$tjac3RTeqObHCLlHsNZj6B1dAlfPsAiPU5+qfauH0io=', 'ROLE_EMPLOYEE');
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (3, 'Mário', 'mario@remont.com', 'PycDJLjUpDWA4rckoxXHnQ==$tjac3RTeqObHCLlHsNZj6B1dAlfPsAiPU5+qfauH0io=', 'ROLE_EMPLOYEE');

-- Clientes (Senha: 1234)
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (4, 'João', 'joao@gmail.com', 'j2IK4ncufg7B96M4SruwHw==$R0x65S+oatz0Owpzv3CsS36xVX0lqO03Z78rYXrv208=', 'ROLE_CLIENT');
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (5, 'José', 'jose@gmail.com', 'j2IK4ncufg7B96M4SruwHw==$R0x65S+oatz0Owpzv3CsS36xVX0lqO03Z78rYXrv208=', 'ROLE_CLIENT');
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (6, 'Joana', 'joana@gmail.com', 'j2IK4ncufg7B96M4SruwHw==$R0x65S+oatz0Owpzv3CsS36xVX0lqO03Z78rYXrv208=', 'ROLE_CLIENT');
INSERT IGNORE INTO users (id, name, email, password, role) VALUES (7, 'Joaquina', 'joaquina@gmail.com', 'j2IK4ncufg7B96M4SruwHw==$R0x65S+oatz0Owpzv3CsS36xVX0lqO03Z78rYXrv208=', 'ROLE_CLIENT');

INSERT IGNORE INTO employees (user_id, birth_date, active, wage, phone, cpf) VALUES
(1, '1990-01-01', 1, 5000.00, '41999991111', '10020030040'),
(2, '1995-05-20', 1, 3500.50, '41999992222', '50060070080'),
(3, '1988-12-15', 1, 4200.00, '41999993333', '90080070060');

INSERT IGNORE INTO clients (user_id, cpf, phone_number, zip_code, street, number, neighborhood, city, state) VALUES
(4, '11111111111', '41999999991', '80000000', 'Rua das Flores', '100', 'Centro', 'Curitiba', 'PR'),
(5, '22222222222', '41999999992', '80000000', 'Av. Brasil', '200', 'Batel', 'Curitiba', 'PR'),
(6, '33333333333', '41999999993', '80000000', 'Rua XV', '300', 'Centro', 'Curitiba', 'PR'),
(7, '44444444444', '41999999994', '80000000', 'Rua 24 Horas', '400', 'Centro', 'Curitiba', 'PR');

INSERT IGNORE INTO services (id, nome, valor_servico) VALUES 
(1, 'Diagnóstico', 50.00),
(2, 'Limpeza interna', 80.00),
(3, 'Limpeza externa', 40.00),
(4, 'Troca de componentes', 120.00),
(5, 'Conserto geral', 200.00),
(6, 'Atualização de software', 60.00),
(7, 'Reparo de placa lógica', 350.00),
(8, 'Substituição de conectores', 90.00),
(9, 'Teste de funcionamento completo', 30.00),
(10, 'Reparo urgente (prioridade)', 150.00);

-- === DADOS RELEVANTES ADICIONADOS PARA TESTES DE RELATÓRIOS ===

INSERT IGNORE INTO maintenance_requests (id, equipment_name, defect_description, request_date, status, client_id, category_id, employee_id) VALUES
(1, 'Notebook Dell XPS', 'Ecrã partido e não liga', '2026-08-20 10:00:00', 'FINALIZADA', 4, 1, 2),
(2, 'Impressora HP Laser', 'Atolamento constante de papel', '2026-08-21 14:30:00', 'PAGA', 5, 3, 3),
(3, 'Desktop Gamer', 'Aquecimento excessivo na GPU', '2026-09-05 09:15:00', 'FINALIZADA', 6, 2, 2);

INSERT IGNORE INTO budgets (id, request_id, employee_id, total, services_description, created_at, updated_at) VALUES
(1, 1, 2, 1500.50, 'Substituição de ecrã, Diagnóstico', '2026-08-20 11:00:00', '2026-08-20 11:00:00'),
(2, 2, 3, 300.00, 'Limpeza interna', '2026-08-21 15:00:00', '2026-08-21 15:00:00'),
(3, 3, 2, 450.00, 'Limpeza interna', '2026-09-05 10:30:00', '2026-09-05 10:30:00');

INSERT IGNORE INTO servicos_orcamento (id, servico_id, orcamento_id) VALUES
(1, 4, 1),
(2, 1, 1),
(3, 2, 2),
(4, 2, 3);
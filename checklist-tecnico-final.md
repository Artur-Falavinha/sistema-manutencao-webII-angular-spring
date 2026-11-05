# Checklist Técnico Final - Build, Docker, Validação e ZIP

**Data da Execução:** 05/11/2026
**Responsável Técnico:** Giulio
**Objetivo:** Validar a execução completa do build de produção, subida dos containers via Docker Compose, testes de interface no Mozilla Firefox e conferência do artefacto ZIP final para entrega acadêmica.

## 1. Build e Testes do Back-end (Spring Boot / Maven)

- [x] **Limpeza de cache e builds anteriores:** Execução do comando `./mvnw clean` concluída.
- [x] **Bateria de Testes:** Execução da suíte de testes unitários e de integração (`./mvnw test`).
  - _Resultado:_ Todos os testes passaram, incluindo a injeção do `DatabaseInitializationTest` e a validação de contratos HTTP do `ReportPdfIntegrationTest`.
- [x] **Empacotamento (JAR):** Build de produção executado com `./mvnw package -DskipTests`.
  - _Resultado:_ Ficheiro executável `app.jar` gerado com sucesso na pasta `/target`, pronto para ser contentorizado.

## 2. Build e Testes do Front-end (Angular)

- [x] **Testes Automatizados:** Execução do Karma/Jasmine em modo headless (`npm test -- --watch=false --browsers=ChromeHeadless`).
  - _Resultado:_ 74 de 74 testes aprovados sem falhas.
- [x] **Verificação de Paridade:** Validação do manifesto de ficheiros (`node tools/verify-parity.mjs`).
  - _Resultado:_ Terminal acusou `0 FORBIDDEN_DIFFERENCE`. O ambiente está síncrono.
- [x] **Build Estático:** Execução do empacotamento de produção (`npm run build`).
  - _Resultado:_ Ficheiros estáticos gerados na pasta `/dist/front-end` sem erros de tipagem do TypeScript ou avisos críticos de bundle size.

## 3. Orquestração e Integração (Docker Compose)

- [x] **Subida da Infraestrutura:** Execução do comando `docker-compose up --build -d` a partir da raiz.
- [x] **Container de Base de Dados (`mysql-db`):**
  - _Status:_ Saudável. Porta 3308 mapeada para o host e a aceitar conexões TCP. Scripts de inicialização rodaram perfeitamente.
- [x] **Container do Back-end (`remont-backend`):**
  - _Status:_ Saudável. Spring Boot iniciou o Tomcat na porta 8080, conectou-se ao MySQL e o JPA Hibernate sincronizou as tabelas.
- [x] **Container do Front-end (`remont-frontend`):**
  - _Status:_ Saudável. Nginx/Node iniciou com sucesso e está a servir a aplicação Angular na porta especificada.

## 4. Homologação de Interface (Mozilla Firefox)

- [x] **Acesso Inicial:** Aplicação acedida via `http://localhost:4200` utilizando o browser Mozilla Firefox (conforme exigência do projeto).
- [x] **Fluxos de Autenticação:** Login testado com credenciais de Admin, Funcionário e Cliente (usando a massa de dados injetada via `data.sql`).
- [x] **Validação Visual (CSS):** Verificação de responsividade, sem quebras de layout no motor de renderização Gecko do Firefox.
- [x] **Módulo de Relatórios (RF019 e RF020):** Geração e download dos PDFs de Receitas por Data e por Categoria executados no front-end real.
  - _Resultado:_ O Firefox interpretou os Blobs corretamente e abriu os PDFs no seu leitor nativo, confirmando o sucesso da integração.

## 5. Empacotamento e Conferência do ZIP

- [x] **Higienização do Diretório:** Remoção manual de diretórios pesados e desnecessários para entrega (`node_modules/`, `target/`, pastas `.angular/`, e `.git/`).
- [x] **Geração do Ficheiro ZIP:** Compressão da pasta raiz do projeto.
- [x] **Teste de Descompressão (Prova dos Nove):** O ZIP foi movido para uma pasta temporária isolada e extraído.
- [x] **Teste a Frio:** Execução limpa do `docker-compose up` diretamente da pasta extraída do ZIP.
  - _Resultado:_ O projeto compilou e subiu do zero sem depender de variáveis da máquina hospedeira. O ZIP final está validado.

**Parecer Final:** O Checklist Técnico Final foi aprovado. A arquitetura do projeto encontra-se estável, documentada e perfeitamente reprodutível. Artefato pronto para a defesa final.

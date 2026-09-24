# Matriz de Testes — Dados, Relatórios e Qualidade

**Responsável:** Giulio  
**Data dos testes registrados:** 23/09/2026  
**Escopo:** Relatórios, dados de demonstração e validações relacionadas à massa mockada.

## Testes realizados hoje

| ID     | Fluxo                   | Cenário testado                                    | Resultado esperado                                                | Resultado  | Observação                                                                                          |
| ------ | ----------------------- | -------------------------------------------------- | ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------- |
| REL-01 | Relatório por período   | Abrir a tela de relatórios com a massa mockada     | A tela deve carregar sem erro e apresentar os dados disponíveis   | **Passou** | A tela carregou com os dados simulados.                                                             |
| REL-02 | Relatório por período   | Informar uma data inicial e uma data final válidas | Exibir somente os registros dentro do período informado           | **Passou** | O filtro por período está sendo aplicado sobre a data dos orçamentos mockados.                      |
| REL-03 | Relatório por período   | Informar período sem registros                     | Não apresentar valores de receita para o período informado        | **Passou** | O retorno ficou sem registros; falta apenas uma mensagem visual específica de “nenhum resultado”.   |
| REL-04 | Relatório por categoria | Alternar para a visão de receita por categoria     | Exibir os valores agrupados por categoria                         | **Passou** | As categorias aparecem utilizando a relação entre solicitação, categoria e orçamento.               |
| REL-05 | Relatório por categoria | Conferir categorias sem orçamento                  | Categoria deve continuar disponível, mas com receita igual a zero | **Passou** | As categorias são inicializadas com zero antes dos orçamentos serem processados.                    |
| DAD-01 | Massa de demonstração   | Conferir quantidade de solicitações disponíveis    | Existir pelo menos 20 solicitações para demonstração              | **Passou** | A massa está preparada com quantidade superior ao mínimo definido para a entrega.                   |
| DAD-02 | Massa de demonstração   | Conferir distribuição dos estados                  | A massa deve contemplar todos os estados cadastrados              | **Passou** | Foram contemplados ABERTA, ORÇADA, APROVADA, REJEITADA, ARRUMADA, PAGA, FINALIZADA e REDIRECIONADA. |

## Pontos observados durante os testes

| ID     | Observação                                                                                                     | Situação               | Próxima ação                                            |
| ------ | -------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------- |
| OBS-01 | Período sem resultado não possui uma mensagem específica na tabela                                             | **Ajuste recomendado** | Avaliar inclusão de estado vazio no relatório           |
| OBS-02 | A alteração/limpeza das datas depende da ação de aplicação do filtro                                           | **A verificar**        | Confirmar comportamento final durante o teste integrado |
| OBS-03 | A massa de demonstração precisa permanecer coerente com clientes, funcionários, categorias e status existentes | **Acompanhar**         | Conferir novamente após os próximos merges              |
| OBS-04 | Os dados de orçamento são utilizados pelo relatório para calcular a receita                                    | **OK**                 | Manter IDs de `requestId` válidos na massa              |

## Testes ainda não realizados — disponíveis para preenchimento

| ID      | Fluxo            | Cenário                                                                               | Resultado esperado                                             | Resultado       | Responsável |
| ------- | ---------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------- | ----------- |
| PEND-01 | Nova solicitação | Criar uma solicitação pelo formulário do cliente e verificar sua aparição na listagem | Solicitação criada e disponível para o fluxo seguinte          | **A preencher** |             |
| PEND-02 | Orçamento        | Criar orçamento para uma solicitação ORÇADA                                           | Orçamento criado e valor refletido nos dados                   | **A preencher** |             |
| PEND-03 | Aprovação        | Aprovar orçamento pelo fluxo do cliente                                               | Solicitação passa para APROVADA                                | **A preencher** |             |
| PEND-04 | Rejeição         | Rejeitar orçamento informando motivo                                                  | Solicitação passa para REJEITADA e mantém o motivo             | **A preencher** |             |
| PEND-05 | Pagamento        | Realizar pagamento de uma solicitação aprovada                                        | Solicitação passa para PAGA                                    | **A preencher** |             |
| PEND-06 | Manutenção       | Registrar manutenção de uma solicitação aprovada                                      | Solicitação fica disponível para o próximo estado do fluxo     | **A preencher** |             |
| PEND-07 | Finalização      | Finalizar solicitação após manutenção/pagamento                                       | Solicitação passa para FINALIZADA                              | **A preencher** |             |
| PEND-08 | Histórico        | Abrir histórico de uma solicitação com várias ocorrências                             | Histórico apresenta os eventos na ordem correta                | **A preencher** |             |
| PEND-09 | Funcionário      | Visualizar solicitações atribuídas                                                    | Solicitações aparecem com cliente, categoria e estado corretos | **A preencher** |             |
| PEND-10 | Integração       | Alterar uma solicitação e conferir o reflexo no relatório                             | Dados usados pelo relatório permanecem coerentes               | **A preencher** |             |

## Registro de execução

**Testes preenchidos nesta versão:** 7  
**Testes pendentes para os demais integrantes:** 10  
**Escopo mantido:** dados, massa mockada e relatórios.

### Critério de aceite relacionado à entrega

- [x] Massa de demonstração com pelo menos 20 solicitações.
- [x] Todos os estados de solicitação representados na massa.
- [x] Relatório por período testado.
- [x] Relatório por categoria testado.
- [x] Categorias sem receita verificadas.
- [ ] Fluxos completos de cliente e funcionário ainda aguardando teste integrado.
- [ ] Testes cruzados entre criação → orçamento → aprovação/rejeição → pagamento → finalização aguardando preenchimento.

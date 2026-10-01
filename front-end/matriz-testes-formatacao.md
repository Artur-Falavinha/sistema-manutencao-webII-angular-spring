# Relatório de Testes: Formatação, ViaCEP e Acessibilidade

**Data:** 01/10/2026
**Responsável pelos testes:** Giulio
**Escopo:** Testar a integração do ViaCEP, máscaras de input, formatação de datas e moedas, além da acessibilidade básica do ecrã.

## 1. O que foi feito esta semana

Esta semana a missão foi dar aquele polimento final na interface e garantir que a entrada de dados do utilizador não vai mandar lixo para a base de dados. O critério de aceitação exige garantir que os "Requisitos de formatação estão aprovados".

Para fechar isto com chave de ouro e sem deixar pontas soltas, dividi os testes em quatro blocos principais. Fui testar todas as máscaras de input (CPF, CEP, telemóvel) para ver se não deixavam passar letras, validei se a API do ViaCEP está a preencher a morada sozinha no registo e confirmei se o dinheiro aparece formatado em Reais (R$) nas tabelas, visto que o nosso projeto exige essa formatação.

Também fiz um teste de usabilidade navegando apenas pelo teclado para ver a acessibilidade, porque o avaliador costuma ser exigente com isso nas apresentações finais.

## 2. Bateria de Testes: Integração ViaCEP

| ID     | O que testei               | O que o utilizador fez                                                 | O que devia acontecer                                                                                                | Status |
| ------ | -------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------ |
| CEP-01 | ViaCEP a funcionar         | Digitei um CEP real e válido (ex: 80000-000) no formulário de registo. | O sistema tem de bater na API do ViaCEP e preencher a rua, bairro, cidade e estado sozinho, sem recarregar a página. | Passou |
| CEP-02 | ViaCEP com erro de rede    | Simulei o modo offline no DevTools e digitei o CEP.                    | O sistema não pode crashar. Tem de libertar os campos para o utilizador poder preencher a morada à mão.              | Passou |
| CEP-03 | ViaCEP com CEP inexistente | Digitei um CEP com formato certo mas que não existe (99999-999).       | A API retorna erro, o formulário deve esconder o erro técnico e deixar preencher os dados manualmente.               | Passou |

## 3. Bateria de Testes: Máscaras de Input

| ID      | O que testei         | O que o utilizador fez                            | O que devia acontecer                                                                                     | Status |
| ------- | -------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| MASK-01 | Máscara de CPF       | Tentei colocar letras e símbolos no input do CPF. | O input tem de bloquear as letras na hora e colocar os pontos e o traço automaticamente (XXX.XXX.XXX-XX). | Passou |
| MASK-02 | Máscara de Telemóvel | Digitei o número de telemóvel com o DDD.          | O campo tem de formatar automaticamente no padrão (XX) 9XXXX-XXXX enquanto o utilizador digita.           | Passou |
| MASK-03 | Máscara de CEP       | Digitei 8 números seguidos no campo de CEP.       | Formatar sozinho para XXXXX-XXX para ficar visualmente correto e acionar o evento do ViaCEP.              | Passou |
| MASK-04 | Apagar caracteres    | Fui apagando o CPF com a tecla Backspace.         | A máscara tem de remover os pontos e traços de forma natural, sem bugar a posição do cursor.              | Passou |

## 4. Bateria de Testes: Datas e Moedas

| ID     | O que testei         | O que o utilizador fez                                       | O que devia acontecer                                                                                               | Status |
| ------ | -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------ |
| FMT-01 | Formatação de Moeda  | Olhei para a tabela de orçamentos e relatórios.              | O valor dos serviços tem de aparecer formatado usando o pipe de currency BR (ex: R$ 1.500,00).                      | Passou |
| FMT-02 | Formatação de Data   | Fui ver a lista do histórico de solicitações.                | As datas não podem aparecer no formato ISO gigante da base de dados. Têm de estar em formato amigável (DD/MM/AAAA). | Passou |
| FMT-03 | Inputs do Datepicker | Selecionei um período no calendário da página de relatórios. | O calendário não pode bugar a formatação quando se escolhe o dia e não pode deixar digitar letras no input.         | Passou |

## 5. Bateria de Testes: Acessibilidade Básica (a11y)

| ID      | O que testei          | O que o utilizador fez                            | O que devia acontecer                                                                                                       | Status |
| ------- | --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------ |
| A11Y-01 | Navegação por Tab     | Apertei a tecla TAB na página de login e registo. | O foco do teclado tem de ir para o email, depois senha e depois botão Entrar, seguindo uma ordem lógica de cima para baixo. | Passou |
| A11Y-02 | Contraste de cor      | Confirmei as tags de status (ex: ABERTA, PAGA).   | A cor da letra tem de dar contraste suficiente com o fundo colorido da tag para se conseguir ler perfeitamente.             | Passou |
| A11Y-03 | Foco em Modais        | Abri a janela de popup de aviso/sucesso.          | O teclado tem de focar na janela que abriu e não pode continuar a interagir com os botões por trás da modal.                | Passou |
| A11Y-04 | Enter nos formulários | Preenchi os dados de login e carreguei no Enter.  | O formulário deve submeter os dados sem precisar de ir com o rato clicar explicitamente no botão "Entrar".                  | Passou |

## 6. Resumo e Conclusão da Semana

Está tudo a correr sobre rodas. A integração com a API do ViaCEP está a puxar os dados super rápido, o que poupa muito tempo a quem se vai registar no sistema. As máscaras de CPF e telefone da biblioteca `ngx-mask` estão impecáveis e a bloquear qualquer entrada errada do utilizador logo no front-end.

As datas e os valores monetários também estão formatados perfeitamente nos componentes usando os pipes nativos do Angular. Portanto, todos os requisitos de formatação estão aprovados para esta entrega e a acessibilidade básica não está a quebrar o fluxo em nenhum momento. Trabalho concluído!

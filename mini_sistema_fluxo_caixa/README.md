# 💰 Mini-Sistema de Fluxo de Caixa (Google Apps Script)

Este é um mini-sistema de gestão financeira desenvolvido para rodar inteiramente no ecossistema Google (Planilhas + Apps Script). Ele funciona como um **Web App** responsivo, utilizando a Planilha Google apenas como banco de dados.

## Funcionalidades

- **Lançamentos Simples:** Registro de Entradas e Saídas com validação de campos obrigatórios.
- **Gestão de Contas:** Módulo separado para Contas a Pagar (com categorias via dropdown) e Contas a Receber (por cliente).
- **Baixa Automática:** Ao marcar uma conta como "Paga", o sistema abre um modal para preencher os detalhes e gera automaticamente um registro na aba de Lançamentos.
- **Resumo Diário:** Visualização de saldos do dia e saldo acumulado, com persistência física na aba `RESUMO_DIARIO`.
- **Dashboard Estatístico:** - Saldo Atual e Necessidade de Capital.
  - Análise de Ciclo Financeiro (Mês atual + Próximo).
  - Gráficos de Evolução de Saldo, Gastos por Categoria e Formas de Pagamento.
- **Regimes de Visualização:** Alterne todo o sistema entre **Regime de Caixa** (data do pagamento) ou **Regime de Competência** (data do vencimento/fato).
- **Filtros Avançados:** Filtro por ano, mês e períodos personalizados.

---

## Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3 (Bootstrap 5), JavaScript.
- **Gráficos:** Chart.js.
- **Backend:** Google Apps Script (V8 Engine).
- **Banco de Dados:** Google Sheets.

---

## Pré-requisitos

1. Uma conta Google (Gmail ou Google Workspace).
2. Uma nova Planilha Google em branco.

---

## Como Instalar

Siga estes passos para colocar o sistema no ar em menos de 5 minutos:

### 1. Preparar o Script
1. Abra sua Planilha Google.
2. Vá no menu superior em **Extensões** > **Apps Script**.
3. No editor que abrir, você verá um arquivo chamado `Código.gs`. Apague tudo o que estiver nele e cole o conteúdo do arquivo `Code.gs` deste repositório.
4. Clique no ícone de `+` ao lado de "Arquivos" e selecione **HTML**. Nomeie o arquivo como `Index` (o Google adicionará o .html automaticamente).
5. Cole o conteúdo do arquivo `Index.html` deste repositório dentro desse novo arquivo criado.
6. Clique no ícone de disquete (Salvar) no topo do editor.

### 2. Configurar a Planilha
1. Você não precisa criar as abas manualmente. O código possui uma função `initSheets()` que cria as abas `LANCAMENTOS`, `CONTAS_A_PAGAR`, `CONTAS_A_RECEBER`, `RESUMO_DIARIO` e `CONFIG` automaticamente na primeira execução.

### 3. Publicar como Web App (Obrigatório)
1. No canto superior direito do editor de script, clique em **Implantar** > **Nova implantação**.
2. Clique na engrenagem de "Tipo de implantação" e escolha **App da Web**.
3. Configure os campos:
   - **Descrição:** Fluxo de Caixa v1.0
   - **Executar como:** Eu (seu e-mail).
   - **Quem tem acesso:** Somente eu.
4. Clique em **Implantar**.
5. O Google pedirá para **Autorizar o acesso**. Clique em "Continuar", selecione sua conta, clique em "Avançado" e depois em "Acessar Projeto (não seguro)".
6. Copie a **URL do App da Web** gerada. Este é o link que você usará para acessar o sistema no navegador ou celular.

---

## Dicas de Uso

* **Configurações Iniciais:** Antes de começar, vá na aba `CONFIG` da sua planilha e preencha as colunas de "Categorias" e "Formas de Pagamento" para que os menus dropdown do sistema apareçam preenchidos.
* **Saldo Inicial:** Defina o valor inicial na aba `CONFIG` (Célula D2) para que o saldo acumulado comece a contar corretamente.
* **Acesso Mobile:** Como o sistema é responsivo, você pode criar um atalho da URL do Web App na tela inicial do seu smartphone para usá-lo como um aplicativo.



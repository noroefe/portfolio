# Pesquisa de Preços CATMAT/CATSER

Aplicação web independente em **Google Apps Script** para consulta de preços públicos na API de Dados Abertos do Compras.gov.br. A aplicação consulta códigos **CATMAT** e **CATSER**, exibe os registros encontrados, permite selecionar referências, montar um carrinho de cotações e gerar relatórios em PDF.

## Visão geral

Este projeto foi estruturado como um **script independente**. Ele não precisa estar vinculado a Google Sheets, Google Docs, Forms ou qualquer outro arquivo do Google Workspace. A tela é publicada como aplicativo da Web pelo próprio Apps Script. As chamadas à API do Compras.gov.br são feitas pelo servidor do Apps Script, usando `UrlFetchApp`.

## Funcionalidades

- Consulta de preços por código CATMAT.
- Consulta de preços por código CATSER.
- Filtro por data inicial e data final.
- Tabela de resultados com data, descrição, unidade, valor unitário e localidade.
- Modal de detalhamento da compra pública.
- Seleção de múltiplas referências.
- Carrinho com referências de vários códigos.
- Relatório PDF individual.
- Relatório PDF em lote para um código.
- Relatório PDF multi-item a partir do carrinho.

## Estrutura do projeto

```text
.
├── Code.gs
├── Index.html
├── appsscript.json
├── README.md
├── LICENSE
```

## Implantação manual

### 1. Criar um projeto independente

1. Acesse o Google Apps Script.
2. Clique em **Novo projeto**.
3. Renomeie o projeto para algo como `Pesquisa de Preços CATMAT CATSER`.

### 2. Adicionar os arquivos

1. Substitua o conteúdo do arquivo `Code.gs` pelo conteúdo deste repositório.
2. Crie um arquivo HTML chamado `Index`.
3. Cole nele o conteúdo de `Index.html`.

### 3. Autorizar o script

Antes de publicar, execute uma função simples pelo editor, por exemplo:

```javascript
obterConfiguracao
```

O Google deve solicitar autorização. A autorização é necessária porque o script usa `UrlFetchApp` para consultar uma URL externa.

## Publicação como aplicativo da Web

Na implantação usada neste projeto, a configuração recomendada é:

- **Tipo de implantação:** Aplicativo da Web.
- **Executar como:** Usuário com acesso ao app.
- **Quem pode acessar:** Qualquer pessoa com uma Conta Google.

Passo a passo:

1. Clique em **Implantar**.
2. Escolha **Nova implantação**.
3. No ícone de engrenagem, selecione **Aplicativo da Web**.
4. Em **Executar como**, selecione **Usuário com acesso ao app**.
5. Em **Quem pode acessar**, selecione **Qualquer pessoa com uma Conta Google**.
6. Clique em **Implantar**.
7. Copie a URL terminada em `/exec`.
8. Compartilhe essa URL com os usuários.

Use sempre a URL pública terminada em `/exec`. Evite compartilhar a URL de teste terminada em `/dev`.

## Como os usuários acessam

O usuário final não precisa instalar nada.

1. Receba ou abra a URL pública da aplicação.
2. Faça login com uma Conta Google, quando solicitado.
3. No primeiro acesso, o Google pode solicitar autorização para executar o aplicativo.
4. Depois da autorização, a tela de pesquisa será aberta normalmente.
5. Informe o código CATMAT ou CATSER, ajuste o período e clique em **Pesquisar**.
6. Use **Ver detalhes**, seleção em lote, carrinho e geração de PDF conforme necessário.

Quando a aplicação é configurada para executar como **usuário com acesso ao app**, cada usuário executa o script com a própria Conta Google. Esse modelo é adequado quando se deseja disponibilizar a ferramenta para usuários autenticados, sem vincular a aplicação a uma planilha, documento ou formulário específico.

## Atualização de versão

Sempre que alterar o código:

1. Clique em **Implantar**.
2. Acesse **Gerenciar implantações**.
3. Edite a implantação existente.
4. Escolha **Nova versão**.
5. Salve.

A URL `/exec` pode continuar a mesma, desde que a implantação existente seja atualizada.

## Origem dos dados e uso responsável

Os dados exibidos são obtidos da API pública de Dados Abertos do Compras.gov.br.

Esta aplicação apenas consulta, organiza e apresenta informações retornadas por essa fonte pública. O projeto não produz, audita, corrige ou certifica os dados apresentados.

Os resultados devem ser tratados como **referência preliminar de pesquisa**, e não como conclusão automática de preço, justificativa administrativa definitiva ou parecer técnico.

Antes de qualquer decisão formal, recomenda-se validação criteriosa dos registros utilizados, incluindo descrição do item ou serviço, unidade de medida, quantidade, data da compra, localidade, modalidade, fornecedor, compatibilidade técnica e pertinência da amostra.

O uso da aplicação, dos dados consultados e dos relatórios gerados é de responsabilidade de quem utiliza, adapta ou implanta a ferramenta.

## Limitações conhecidas

- A aplicação depende da disponibilidade da API pública do Compras.gov.br.
- A API pode alterar nomes de campos, formato de resposta ou regras de consulta.
- O relatório em PDF reflete os dados retornados no momento da consulta.
- A média de valores não substitui análise técnica, saneamento de amostra ou justificativa formal de preço.
- O carrinho permite consolidar itens diferentes, mas médias gerais de itens de naturezas distintas devem ser interpretadas com cuidado.

## Segurança, privacidade e responsabilidade de uso

- A aplicação não grava dados em planilhas.
- A aplicação não usa banco de dados.
- A aplicação não armazena histórico de consultas.
- As consultas são feitas em tempo real à API pública de Dados Abertos do Compras.gov.br.
- Os relatórios gerados refletem os dados disponíveis no momento da consulta.
- Cada pessoa ou organização que implantar, modificar ou utilizar esta aplicação é responsável por validar os resultados e adequar o uso às suas próprias normas, procedimentos e necessidades.
- Este projeto é fornecido como ferramenta auxiliar, sem garantia de disponibilidade, exatidão, atualização contínua, adequação legal, administrativa ou técnica para qualquer finalidade específica.


## Licença

Este projeto é distribuído sob licença MIT.

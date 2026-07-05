/**
 * Pesquisa de Preços CATMAT/CATSER
 * Aplicação web independente em Google Apps Script.
 */

const APP = {
  nome: 'Pesquisa de Preços CATMAT/CATSER',
  versao: '1.1.0',
  tamanhoPagina: 100,
  baseUrl: 'https://dadosabertos.compras.gov.br/modulo-pesquisa-preco',
  swaggerUrl: 'https://dadosabertos.compras.gov.br/swagger-ui/index.html',
  catalogoUrl: 'https://catalogo.compras.gov.br/cnbs-web/busca'
};

const HTTP_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; PesquisaPrecosCATMATCATSER/1.0)',
  Accept: 'application/json'
};

function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle(APP.nome)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function obterConfiguracao() {
  return {
    nome: APP.nome,
    versao: APP.versao,
    catalogoUrl: APP.catalogoUrl
  };
}

function buscarPrecosMaterial(codigo, dataInicio, dataFim) {
  return buscarPrecos('CATMAT', codigo, dataInicio, dataFim);
}

function buscarPrecosServico(codigo, dataInicio, dataFim) {
  return buscarPrecos('CATSER', codigo, dataInicio, dataFim);
}

function buscarPrecos(tipo, codigo, dataInicio, dataFim) {
  const tipoValido = normalizarTipo(tipo);
  const codigoLimpo = sanitizarCodigo(codigo);

  if (!codigoLimpo) {
    throw new Error('Informe um código CATMAT ou CATSER válido.');
  }

  const endpoint = tipoValido === 'CATSER' ? '3_consultarServico' : '1_consultarMaterial';
  const params = {
    pagina: 1,
    tamanhoPagina: APP.tamanhoPagina,
    codigoItemCatalogo: codigoLimpo
  };

  if (dataInicio) params.dataCompraInicio = dataInicio;
  if (dataFim) params.dataCompraFim = dataFim;

  const url = montarUrl(`${APP.baseUrl}/${endpoint}`, params);
  const dados = chamarApiCompras(url);

  return dados.map(item => normalizarItem(item, tipoValido));
}

function chamarApiCompras(url) {
  const options = {
    method: 'get',
    headers: HTTP_HEADERS,
    muteHttpExceptions: true,
    followRedirects: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const status = response.getResponseCode();
  const texto = response.getContentText('UTF-8');

  if (status < 200 || status >= 300) {
    throw new Error(`API Compras.gov.br retornou HTTP ${status}. Tente novamente mais tarde ou revise os filtros.`);
  }

  let json;
  try {
    json = JSON.parse(texto);
  } catch (erro) {
    throw new Error('A API retornou uma resposta em formato inesperado.');
  }

  const dados = json.resultado || json.data || json.itens || json.content || json.registros || [];

  if (!Array.isArray(dados)) {
    throw new Error('A estrutura da resposta da API mudou ou não pôde ser interpretada.');
  }

  return dados;
}

function normalizarItem(item, tipo) {
  return {
    codigoItemCatalogo: pegar(item, 'codigoItemCatalogo', 'codigoServico', 'codigo', 'codigoItem'),
    descricaoItem: pegar(item, 'descricaoItem', 'descricao', 'nomeServico', 'descricaoServico', 'nome'),
    siglaUnidadeMedida: normalizarUnidade(pegar(item, 'siglaUnidadeMedida', 'unidadeMedida', 'siglaUnidade', 'unidade')),
    precoUnitario: numero(pegar(item, 'precoUnitario', 'valorUnitario', 'preco', 'valor')),
    quantidade: numero(pegar(item, 'quantidade', 'qtd', 'qtde', 'quantidadeItem')),
    dataCompra: pegar(item, 'dataCompra', 'dataResultado', 'dataContrato', 'dataCotacao', 'dataRegistro'),
    idCompra: pegar(item, 'idCompra', 'idContrato', 'numeroContrato', 'numeroProcesso', 'id'),
    idItemCompra: pegar(item, 'idItemCompra', 'idItem', 'itemId'),
    numeroItemCompra: pegar(item, 'numeroItemCompra', 'numeroItem', 'itemNumero', 'sequencial'),
    modalidade: pegar(item, 'modalidade', 'codigoModalidade', 'modalidadeLicitacao'),
    nomeOrgao: pegar(item, 'nomeOrgao', 'orgao', 'nomeUnidade', 'descricaoOrgao'),
    municipio: pegar(item, 'municipio', 'nomeMunicipio', 'cidade', 'municipioOrgao'),
    estado: pegar(item, 'estado', 'uf', 'siglaUf', 'siglaEstado'),
    nomeFornecedor: pegar(item, 'nomeFornecedor', 'razaoSocial', 'fornecedor', 'nomeEmpresa'),
    niFornecedor: pegar(item, 'niFornecedor', 'cnpjFornecedor', 'cpfCnpj', 'cnpj', 'cpf'),
    marca: tipo === 'CATMAT' ? pegar(item, 'marca', 'marcaProduto', 'nomeMarca') : null,
    _tipo: tipo
  };
}

function gerarPDF(item, tipo) {
  const tipoFinal = normalizarTipo(tipo || item._tipo || 'CATMAT');
  const html = cssPdf() + montarHtmlRelatorioIndividual(item, tipoFinal);
  const dataCompra = dataMesAnoArquivo(item.dataCompra);
  const codigo = limparNomeArquivo(item.codigoItemCatalogo || 'item');
  const blob = HtmlService.createHtmlOutput(html).getAs(MimeType.PDF);

  blob.setName(`Relatorio_${tipoFinal}_${codigo}_${dataCompra}.pdf`);
  return respostaArquivo(blob);
}

function gerarPDFLote(itens, tipo) {
  if (!itens || !itens.length) {
    return { error: 'Nenhum item selecionado.' };
  }

  const tipoFinal = normalizarTipo(tipo || itens[0]._tipo || 'CATMAT');
  const itensNormalizados = itens.map(item => Object.assign({}, item, {
    siglaUnidadeMedida: normalizarUnidade(item.siglaUnidadeMedida),
    _tipo: tipoFinal
  }));

  let html = montarHtmlFolhaLote(itensNormalizados, tipoFinal);
  itensNormalizados.forEach(item => {
    html += montarHtmlRelatorioIndividual(item, tipoFinal);
  });

  const codigo = limparNomeArquivo(itensNormalizados[0].codigoItemCatalogo || 'codigo');
  const blob = HtmlService.createHtmlOutput(html).getAs(MimeType.PDF);
  blob.setName(`Relatorio_Lote_${tipoFinal}_${codigo}_${dataArquivoHoje()}.pdf`);

  return respostaArquivo(blob);
}

function gerarPDFCarrinho(itens) {
  if (!itens || !itens.length) {
    return { error: 'Carrinho vazio.' };
  }

  const normalizados = itens.map(item => Object.assign({}, item, {
    _tipo: normalizarTipo(item._tipo || 'CATMAT'),
    siglaUnidadeMedida: normalizarUnidade(item.siglaUnidadeMedida)
  }));

  let html = montarHtmlFolhaCarrinho(normalizados);
  const grupos = agruparPorCodigo(normalizados);

  grupos.ordem.forEach(chave => {
    const grupo = grupos.mapa[chave];
    html += montarHtmlSecaoGrupo(grupo);
    grupo.itens.forEach(item => {
      html += montarHtmlRelatorioIndividual(item, grupo.tipo);
    });
  });

  const blob = HtmlService.createHtmlOutput(html).getAs(MimeType.PDF);
  blob.setName(`Relatorio_Carrinho_${dataArquivoHoje()}.pdf`);

  return respostaArquivo(blob);
}

function montarHtmlRelatorioIndividual(item, tipo) {
  const isCatser = tipo === 'CATSER';
  const unidade = normalizarUnidade(item.siglaUnidadeMedida);
  const quantidade = numero(item.quantidade);
  const preco = numero(item.precoUnitario);
  const total = preco * quantidade;
  const dataCompra = formatarData(item.dataCompra);
  const mesAno = formatarMesAno(item.dataCompra);
  const modalidade = obterDescricaoModalidade(item.modalidade);
  const linkPncp = `https://pncp.gov.br/app/editais?q=${encodeURIComponent(item.idCompra || '')}&pagina=1&status=todos`;
  const referencia = montarReferencia();
  const cor = isCatser ? 'green' : 'blue';
  const marca = !isCatser
    ? `<tr><td class="label">Marca</td><td>${esc(item.marca || 'Não informada')}</td></tr>`
    : '';

  return `
  <section class="pdf-page detail-page">
    <table class="doc-header ${cor}">
      <tr>
        <td>
          <div class="header-kicker">Relatório individual</div>
          <div class="header-title">Pesquisa de Preço — ${tipo}</div>
          <div class="header-subtitle">Código ${tipo}: <strong>${esc(item.codigoItemCatalogo || 'N/D')}</strong> · Compra: ${esc(mesAno)}</div>
        </td>
        <td class="header-date">${esc(dataHojeBr())}</td>
      </tr>
    </table>

    <div class="section">
      <div class="section-title">1. Identificação do ${isCatser ? 'serviço' : 'material'}</div>
      <table class="info-table">
        <tr><td class="label">Código ${tipo}</td><td>${esc(item.codigoItemCatalogo || 'N/D')}</td></tr>
        <tr><td class="label">Descrição</td><td>${esc(item.descricaoItem || 'N/D')}</td></tr>
      </table>
    </div>

    <table class="metric-row">
      <tr>
        <td><span>Valor unitário</span><strong>${moeda(preco)}</strong></td>
        <td><span>Quantidade</span><strong>${quantidade || 'N/D'} ${esc(unidade)}</strong></td>
        <td><span>Valor total</span><strong>${moeda(total)}</strong></td>
      </tr>
    </table>

    <div class="section">
      <div class="section-title">2. Detalhamento do preço</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th class="right">Valor unitário</th>
            <th>Unidade</th>
            <th class="right">Quantidade</th>
            <th class="right">Valor total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Praticado</td>
            <td class="right">${moeda(preco)}</td>
            <td>${esc(unidade)}</td>
            <td class="right">${quantidade || 'N/D'}</td>
            <td class="right strong">${moeda(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">3. Processo de compra</div>
      <table class="info-table two-cols">
        <tr>
          <td class="label">Órgão</td><td>${esc(item.nomeOrgao || 'N/D')}</td>
          <td class="label">Modalidade</td><td>${esc(modalidade)}</td>
        </tr>
        <tr>
          <td class="label">Data da compra</td><td>${esc(dataCompra)}</td>
          <td class="label">Localidade</td><td>${esc(item.municipio || 'N/D')} / ${esc(item.estado || 'N/D')}</td>
        </tr>
        <tr>
          <td class="label">Número da compra</td><td>${esc(item.idCompra || 'N/D')}</td>
          <td class="label">Item / sequência</td><td>ID ${esc(item.idItemCompra || 'N/D')} / Seq. ${esc(item.numeroItemCompra || 'N/D')}</td>
        </tr>
      </table>
      <div class="link-box"><strong>Consulta no PNCP:</strong><br><a href="${linkPncp}">${linkPncp}</a></div>
    </div>

    <div class="section">
      <div class="section-title">4. Fornecedor</div>
      <table class="info-table">
        <tr><td class="label">Razão social</td><td>${esc(item.nomeFornecedor || 'N/D')}</td></tr>
        <tr><td class="label">CNPJ/CPF</td><td>${esc(item.niFornecedor || 'N/D')}</td></tr>
        ${marca}
      </table>
    </div>

    <div class="reference">
      <strong>Referência</strong>
      <p>${esc(referencia)}</p>
    </div>
  </section>`;
}

function montarHtmlFolhaLote(itens, tipo) {
  const isCatser = tipo === 'CATSER';
  const precos = itens.map(item => numero(item.precoUnitario));
  const codigo = itens[0].codigoItemCatalogo || 'N/D';
  const descricao = itens[0].descricaoItem || 'N/D';
  const unidade = normalizarUnidade(itens[0].siglaUnidadeMedida);
  const estat = calcularEstatisticas(precos);
  const fornecedores = mapearFornecedores(itens, isCatser);
  const referencia = montarReferencia();
  const cor = isCatser ? 'green' : 'blue';

  const thMarca = isCatser ? '' : '<th>Marca(s)</th>';
  const linhas = fornecedores.map((f, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${esc(f.nome)}</td>
      ${isCatser ? '' : `<td>${esc(f.marcas || '—')}</td>`}
      <td class="right">${esc(f.precos)}</td>
    </tr>`).join('');

  return `
  ${cssPdf()}
  <section class="pdf-page cover-page">
    <table class="doc-header ${cor}">
      <tr>
        <td>
          <div class="header-kicker">Consolidado por código</div>
          <div class="header-title">Relatório de Pesquisa de Preço</div>
          <div class="header-subtitle">Preços públicos de referência — ${tipo}</div>
        </td>
        <td class="header-date">${esc(dataHojeBr())}</td>
      </tr>
    </table>

    <div class="section">
      <div class="section-title">1. Identificação</div>
      <table class="info-table">
        <tr><td class="label">Código ${tipo}</td><td>${esc(codigo)}</td></tr>
        <tr><td class="label">Descrição</td><td>${esc(descricao)}</td></tr>
        <tr><td class="label">Unidade de medida</td><td>${esc(unidade)}</td></tr>
        <tr><td class="label">Base de cálculo</td><td>${itens.length} referência(s) de contratações públicas</td></tr>
      </table>
    </div>

    <table class="summary-panel">
      <tr>
        <td>
          <span>Média de mercado</span>
          <strong>${moeda(estat.media)}</strong>
          <small>Menor: ${moeda(estat.menor)} · Maior: ${moeda(estat.maior)} · Unidade: ${esc(unidade)}</small>
        </td>
      </tr>
    </table>

    <div class="section">
      <div class="section-title">2. Fornecedores utilizados na composição do preço médio</div>
      <table class="data-table">
        <thead><tr><th class="center">#</th><th>Fornecedor</th>${thMarca}<th class="right">Preço(s) unitário(s)</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>

    <div class="reference">
      <strong>Referência</strong>
      <p>${esc(referencia)}</p>
      <p class="note">As páginas seguintes apresentam o detalhamento individual de cada referência selecionada.</p>
    </div>
  </section>`;
}

function montarHtmlFolhaCarrinho(itens) {
  const grupos = agruparPorCodigo(itens);
  const precos = itens.map(item => numero(item.precoUnitario));
  const estat = calcularEstatisticas(precos);
  const referencia = montarReferencia();

  const linhas = grupos.ordem.map((chave, idx) => {
    const grupo = grupos.mapa[chave];
    const ps = grupo.itens.map(item => numero(item.precoUnitario));
    const e = calcularEstatisticas(ps);
    return `
      <tr>
        <td class="center">${idx + 1}</td>
        <td class="center"><span class="type-badge ${grupo.tipo === 'CATSER' ? 'green' : 'blue'}">${esc(grupo.tipo)}</span></td>
        <td class="center strong">${esc(grupo.codigo || 'N/D')}</td>
        <td>${esc(grupo.descricao || 'N/D')}</td>
        <td class="center">${esc(grupo.unidade || 'un')}</td>
        <td class="right">${grupo.itens.length}</td>
        <td class="right strong">${moeda(e.media)}</td>
        <td class="right">${moeda(e.menor)}</td>
        <td class="right">${moeda(e.maior)}</td>
      </tr>`;
  }).join('');

  return `
  ${cssPdf()}
  <section class="pdf-page cover-page">
    <table class="doc-header blue">
      <tr>
        <td>
          <div class="header-kicker">Consolidado multi-item</div>
          <div class="header-title">Relatório de Pesquisa de Preço</div>
          <div class="header-subtitle">Preços públicos de referência — CATMAT/CATSER</div>
        </td>
        <td class="header-date">${esc(dataHojeBr())}</td>
      </tr>
    </table>

    <table class="summary-panel">
      <tr>
        <td>
          <span>Média geral dos registros selecionados</span>
          <strong>${moeda(estat.media)}</strong>
          <small>${itens.length} referência(s) · ${grupos.ordem.length} código(s) · Menor: ${moeda(estat.menor)} · Maior: ${moeda(estat.maior)}</small>
          <p>A média geral pode agregar itens de naturezas diferentes. Para decisão de preço, priorize a análise individual por código.</p>
        </td>
      </tr>
    </table>

    <div class="section">
      <div class="section-title">1. Resumo dos itens pesquisados</div>
      <table class="data-table compact-table">
        <thead>
          <tr><th class="center">#</th><th class="center">Tipo</th><th class="center">Código</th><th>Descrição</th><th class="center">Unid.</th><th class="right">Cotações</th><th class="right">Média</th><th class="right">Menor</th><th class="right">Maior</th></tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>

    <div class="reference">
      <strong>Referência</strong>
      <p>${esc(referencia)}</p>
      <p class="note">As páginas seguintes apresentam os grupos e o detalhamento individual das referências selecionadas.</p>
    </div>
  </section>`;
}

function montarHtmlSecaoGrupo(grupo) {
  const ps = grupo.itens.map(item => numero(item.precoUnitario));
  const estat = calcularEstatisticas(ps);
  const isCatser = grupo.tipo === 'CATSER';
  const fornecedores = mapearFornecedores(grupo.itens, isCatser);
  const thMarca = isCatser ? '' : '<th>Marca(s)</th>';
  const cor = isCatser ? 'green' : 'blue';
  const linhas = fornecedores.map((f, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td>${esc(f.nome)}</td>
      ${isCatser ? '' : `<td>${esc(f.marcas || '—')}</td>`}
      <td class="right">${esc(f.precos)}</td>
    </tr>`).join('');

  return `
  <section class="pdf-page group-page">
    <table class="doc-header ${cor}">
      <tr>
        <td>
          <div class="header-kicker">Resumo do grupo</div>
          <div class="header-title">Pesquisa de Preço — ${esc(grupo.tipo)} ${esc(grupo.codigo || 'N/D')}</div>
          <div class="header-subtitle">${esc(grupo.descricao || 'N/D')} · Unidade: ${esc(grupo.unidade || 'un')}</div>
        </td>
      </tr>
    </table>

    <table class="summary-panel compact">
      <tr>
        <td>
          <span>Preço médio unitário</span>
          <strong>${moeda(estat.media)}</strong>
          <small>${grupo.itens.length} cotação(ões) · Menor: ${moeda(estat.menor)} · Maior: ${moeda(estat.maior)}</small>
        </td>
      </tr>
    </table>

    <div class="section">
      <div class="section-title">Fornecedores</div>
      <table class="data-table">
        <thead><tr><th class="center">#</th><th>Fornecedor</th>${thMarca}<th class="right">Preço(s)</th></tr></thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>
  </section>`;
}

function cssPdf() {
  return `
  <style>
    @page { size: A4; margin: 15mm 13mm; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #20242a; font-size: 9.5pt; line-height: 1.38; }
    .pdf-page { page-break-after: always; }
    .pdf-page:last-child { page-break-after: auto; }
    .doc-header { width: 100%; border-collapse: collapse; margin: 0 0 14px 0; color: #fff; }
    .doc-header td { border: 0; padding: 13px 15px; vertical-align: top; }
    .doc-header.blue td { background: #183b66; }
    .doc-header.green td { background: #1f5c3d; }
    .header-kicker { font-size: 7.4pt; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; color: #dbe8f7; margin-bottom: 3px; }
    .header-title { font-size: 17pt; line-height: 1.08; font-weight: 700; margin-bottom: 3px; }
    .header-subtitle { font-size: 9pt; color: #eef4fb; }
    .header-date { width: 86px; text-align: center; font-size: 8.5pt; font-weight: 700; white-space: nowrap; }
    .section { margin: 0 0 13px 0; }
    .section-title { background: #eef1f5; border-left: 4px solid #394a5f; color: #222; padding: 6px 8px; font-size: 9.4pt; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; margin-bottom: 7px; }
    table { width: 100%; border-collapse: collapse; }
    .info-table td { border: 1px solid #d9dde3; padding: 5px 7px; vertical-align: top; }
    .info-table .label { width: 118px; background: #f7f8fa; color: #4d5560; font-size: 8.2pt; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
    .two-cols .label { width: 92px; }
    .metric-row { border-collapse: separate; border-spacing: 7px 0; margin: 0 -7px 14px -7px; }
    .metric-row td { width: 33.33%; border: 1px solid #d4dae2; background: #fbfcfe; padding: 9px 10px; }
    .metric-row span, .summary-panel span { display: block; color: #606b79; font-size: 7.8pt; text-transform: uppercase; font-weight: 700; letter-spacing: .03em; margin-bottom: 3px; }
    .metric-row strong { display: block; color: #12355b; font-size: 12.6pt; }
    .summary-panel { margin: 0 0 15px 0; }
    .summary-panel td { border: 2px solid #2f6fb0; background: #f2f7ff; text-align: center; padding: 12px 14px; }
    .summary-panel.compact td { padding: 10px 12px; }
    .summary-panel strong { display: block; color: #164d87; font-size: 21pt; line-height: 1.1; margin: 2px 0 3px 0; }
    .summary-panel small { color: #596575; font-size: 8.3pt; }
    .summary-panel p { color: #596575; margin: 7px 0 0; font-size: 8pt; }
    .data-table th { background: #394a5f; color: #fff; border: 1px solid #394a5f; padding: 5px 6px; text-align: left; font-size: 8.3pt; }
    .data-table td { border: 1px solid #d9dde3; padding: 5px 6px; vertical-align: top; font-size: 8.4pt; }
    .data-table tbody tr:nth-child(even) td { background: #f8f9fb; }
    .compact-table th, .compact-table td { font-size: 7.7pt; padding: 4px 5px; }
    .right { text-align: right !important; }
    .center { text-align: center !important; }
    .strong { font-weight: 700; }
    .link-box { margin-top: 7px; border: 1px solid #d7dde5; background: #fbfcfe; padding: 7px 8px; font-size: 8pt; word-break: break-all; }
    .link-box a { color: #174d86; text-decoration: none; }
    .reference { border-top: 1px solid #b8bec8; padding-top: 8px; margin-top: 17px; font-size: 7.8pt; color: #555; }
    .reference p { margin: 3px 0 0; text-align: justify; }
    .reference .note { text-align: center; color: #777; margin-top: 10px; }
    .type-badge { display: inline-block; color: #fff; font-size: 7pt; padding: 2px 5px; font-weight: 700; }
    .type-badge.blue { background: #183b66; }
    .type-badge.green { background: #1f5c3d; }
  </style>`;
}

function agruparPorCodigo(itens) {
  const mapa = {};
  const ordem = [];

  itens.forEach(item => {
    const tipo = normalizarTipo(item._tipo || 'CATMAT');
    const codigo = item.codigoItemCatalogo || 'N/D';
    const chave = `${tipo}_${codigo}`;

    if (!mapa[chave]) {
      mapa[chave] = {
        tipo,
        codigo,
        descricao: item.descricaoItem || 'N/D',
        unidade: normalizarUnidade(item.siglaUnidadeMedida),
        itens: []
      };
      ordem.push(chave);
    }

    mapa[chave].itens.push(item);
  });

  return { mapa, ordem };
}

function mapearFornecedores(itens, isCatser) {
  const mapa = {};
  const ordem = [];

  itens.forEach(item => {
    const nome = item.nomeFornecedor || 'Não informado';
    if (!mapa[nome]) {
      mapa[nome] = { nome, marcas: new Set(), precos: [] };
      ordem.push(nome);
    }
    if (!isCatser && item.marca) mapa[nome].marcas.add(item.marca);
    mapa[nome].precos.push(moeda(numero(item.precoUnitario)));
  });

  return ordem.map(nome => ({
    nome,
    marcas: Array.from(mapa[nome].marcas).join(', '),
    precos: mapa[nome].precos.join(', ')
  }));
}

function calcularEstatisticas(valores) {
  const lista = valores.map(numero).filter(v => !isNaN(v));
  if (!lista.length) return { media: 0, menor: 0, maior: 0 };
  const soma = lista.reduce((acc, valor) => acc + valor, 0);
  return {
    media: soma / lista.length,
    menor: Math.min.apply(null, lista),
    maior: Math.max.apply(null, lista)
  };
}

function montarUrl(base, params) {
  const query = Object.keys(params)
    .filter(k => params[k] !== null && params[k] !== undefined && params[k] !== '')
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join('&');

  return `${base}?${query}`;
}

function pegar(obj) {
  for (let i = 1; i < arguments.length; i++) {
    const chave = arguments[i];
    if (obj && obj[chave] !== undefined && obj[chave] !== null && obj[chave] !== '') {
      return obj[chave];
    }
  }
  return null;
}

function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return valor;
  const n = parseFloat(String(valor).replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function normalizarUnidade(valor) {
  const texto = String(valor || '').trim();
  if (!texto || texto === '-' || texto.toUpperCase() === 'N/D' || texto.toUpperCase() === 'ND') {
    return 'un';
  }
  return texto;
}

function normalizarTipo(tipo) {
  return String(tipo || '').toUpperCase() === 'CATSER' ? 'CATSER' : 'CATMAT';
}

function sanitizarCodigo(codigo) {
  return String(codigo || '').replace(/\D/g, '');
}

function obterDescricaoModalidade(codigo) {
  const mapa = {
    '01': 'CONVITE',
    '02': 'TOMADA DE PREÇOS',
    '03': 'CONCORRÊNCIA',
    '04': 'CONCORRÊNCIA INTERNACIONAL',
    '05': 'PREGÃO',
    '06': 'DISPENSA DE LICITAÇÃO',
    '07': 'INEXIGIBILIDADE DE LICITAÇÃO',
    '12': 'CREDENCIAMENTO',
    '20': 'CONCURSO',
    '22': 'TOMADA DE PREÇOS POR TÉCNICA E PREÇO',
    '33': 'CONCORRÊNCIA POR TÉCNICA E PREÇO',
    '44': 'CONCORRÊNCIA INTERNACIONAL POR TÉCNICA E PREÇO',
    '57': 'CONVÊNIO'
  };

  if (!codigo) return 'N/D';
  return mapa[String(codigo).padStart(2, '0')] || `Código ${codigo}`;
}

function respostaArquivo(blob) {
  return {
    bytes: Utilities.base64Encode(blob.getBytes()),
    fileName: blob.getName(),
    mimeType: blob.getContentType()
  };
}

function montarReferencia() {
  const d = new Date();
  const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  return `BRASIL. Ministério da Gestão e da Inovação em Serviços Públicos. API Compras.gov.br. ${d.getFullYear()}. Disponível em: ${APP.swaggerUrl}. Dados consultados e relatório gerado em: ${String(d.getDate()).padStart(2, '0')} ${meses[d.getMonth()]} ${d.getFullYear()}.`;
}

function moeda(valor) {
  return numero(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatarData(valor) {
  const data = criarData(valor);
  if (!data) return 'N/D';
  return Utilities.formatDate(data, Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function formatarMesAno(valor) {
  const data = criarData(valor);
  if (!data) return 'N/D';
  return Utilities.formatDate(data, Session.getScriptTimeZone(), 'MM/yyyy');
}

function dataMesAnoArquivo(valor) {
  const data = criarData(valor);
  if (!data) return 'sem-data';
  return Utilities.formatDate(data, Session.getScriptTimeZone(), 'MM-yyyy');
}

function dataArquivoHoje() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy');
}

function dataHojeBr() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');
}

function criarData(valor) {
  if (!valor) return null;
  const data = new Date(valor);
  return isNaN(data.getTime()) ? null : data;
}

function limparNomeArquivo(valor) {
  return String(valor || 'arquivo').replace(/[^a-zA-Z0-9_-]/g, '-');
}

function esc(valor) {
  return String(valor === null || valor === undefined ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

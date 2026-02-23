/**
 * DIÁRIO DE MISSÕES - BACKEND
 */

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Diário de Campanha')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setupSystem() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = {
    '🏰 OBRIGAÇÕES': ['ID', 'Título', 'Descrição', 'Categoria', 'Mês', 'Data Prevista', 'Prioridade', 'Classificação Final', 'Concluída', 'Data Conclusão'],
    '💰 TESOURO': ['ID', 'Tipo', 'Descrição', 'Valor Financeiro', 'Data', 'Categoria', 'Observação'],
    '⚔️ MISSÕES': ['ID', 'Título', 'Descrição', 'Tipo', 'Status', 'Data Início', 'Data Fim', 'Avaliação Final', 'Observações'],
    '📜 TRATADOS': ['ID', 'Título do Tratado', 'Descrição do Juramento', 'Data', 'Prazo', 'Status'],
    '📅 AGENDA': ['ID', 'Título', 'Descrição', 'Data', 'Hora Início', 'Hora Fim', 'Local', 'Criado no Google Agenda', 'Event ID'],
    '📊 PROGRESSO': ['Mês', 'Obrigações (%)', 'Tesouros (R$)', 'Ativos Intelectuais', 'Missões Concluídas', 'Tratados Cumpridos', 'Índice Geral (%)']
  };
  for (let sheetName in sheets) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight('bold').setBackground('#1a2530').setFontColor('#d4af37');
      sheet.setFrozenRows(1);
    }
  }
  return true;
}

function generateID() {
  return Utilities.getUuid().split('-')[0].toUpperCase();
}

function getSheetData(sheetName) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return [];
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];
    const headers = data[0];
    return data.slice(1).map(row => {
      let obj = {};
      headers.forEach((h, i) => {
        let value = row[i];
        if (value instanceof Date) {
          if (value.getFullYear() === 1899 || value.getFullYear() === 1900) {
            value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
          } else {
            value = value.toISOString();
          }
        } else if (value && typeof value === 'object') {
          value = String(value);
        }
        obj[h] = value;
      });
      return obj;
    }).reverse();
  } catch(e) {
    Logger.log("Erro no getSheetData: " + e.message);
    return [];
  }
}

function addRecord(sheetName, recordArray) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const id = generateID();
    sheet.appendRow([id, ...recordArray]);
    return { success: true, message: 'Registro adicionado com sucesso!' };
  } catch (e) {
    return { success: false, message: 'Erro: ' + e.message };
  }
}

function updateField(sheetName, id, fieldName, newValue) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('ID');
    const fieldIdx = headers.indexOf(fieldName);
    if (fieldIdx === -1) return { success: false, message: 'Campo não encontrado: ' + fieldName };
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIdx]) === String(id)) {
        sheet.getRange(i + 1, fieldIdx + 1).setValue(newValue);
        return { success: true };
      }
    }
    return { success: false, message: 'ID não encontrado.' };
  } catch(e) {
    return { success: false, message: e.message };
  }
}

function toggleObrigacao(id, isCompleted) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('🏰 OBRIGAÇÕES');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');
    const statusIndex = headers.indexOf('Concluída');
    const dateIndex = headers.indexOf('Data Conclusão');
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idIndex]) === String(id)) {
        sheet.getRange(i + 1, statusIndex + 1).setValue(isCompleted);
        const conclusao = isCompleted ? Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy') : '';
        sheet.getRange(i + 1, dateIndex + 1).setValue(conclusao);
        return { success: true };
      }
    }
    return { success: false, message: 'ID não encontrado.' };
  } catch (e) { return { success: false, message: e.message }; }
}

function addAgendaRecord(dados) {
  try {
    let eventId = '';
    let criadoAgenda = false;
    try {
      const start = new Date(`${dados.data}T${dados.horaInicio}:00`);
      const end = new Date(`${dados.data}T${dados.horaFim}:00`);
      const event = CalendarApp.getDefaultCalendar().createEvent(dados.titulo, start, end, {
        description: dados.descricao,
        location: dados.local
      });
      eventId = event.getId();
      criadoAgenda = true;
    } catch (calErr) {
      Logger.log('Erro ao criar no calendário: ' + calErr);
    }
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('📅 AGENDA');
    const id = generateID();
    sheet.appendRow([id, dados.titulo, dados.descricao, dados.data, dados.horaInicio, dados.horaFim, dados.local, criadoAgenda, eventId]);
    return { success: true, message: criadoAgenda ? 'Criado na planilha e no Agenda!' : 'Criado apenas na planilha.' };
  } catch (e) {
    return { success: false, message: e.message };
  }
}


function getDashboardData(filtroMes, filtroAno) {
  try {
    const obrigacoes = getSheetData('🏰 OBRIGAÇÕES');
    const tesouro    = getSheetData('💰 TESOURO');
    const missoes    = getSheetData('⚔️ MISSÕES');
    const tratados   = getSheetData('📜 TRATADOS');

    const mesesPT = ['janeiro','fevereiro','março','abril','maio','junho',
                     'julho','agosto','setembro','outubro','novembro','dezembro'];
    const dataAtual   = new Date();
    const anoAtual    = dataAtual.getFullYear();
    const mesAtualStr = mesesPT[dataAtual.getMonth()];

    const mesAlvo = (filtroMes && filtroMes !== '') ? filtroMes.toLowerCase() : mesAtualStr;
    const anoAlvo = (filtroAno && filtroAno !== '') ? parseInt(filtroAno) : anoAtual;
    const mesIdx  = mesesPT.indexOf(mesAlvo); // 0-11

    // ── helpers ──────────────────────────────────────────────
    function parseMA(isoStr) {
      // Retorna {m, y} (UTC) ou null
      if (!isoStr) return null;
      const d = new Date(isoStr);
      return isNaN(d) ? null : { m: d.getUTCMonth(), y: d.getUTCFullYear() };
    }
    function eqMA(isoStr, m, y) {
      const r = parseMA(isoStr);
      return r && r.m === m && r.y === y;
    }

    // ── OBRIGAÇÕES ─────────────────────────────────────────
    const obrFiltradas = obrigacoes.filter(o => {
      if (!o['Mês'] || o['Mês'].toLowerCase() !== mesAlvo) return false;
      // Conferir ano pela Data Prevista
      if (o['Data Prevista']) {
        const dp = parseMA(o['Data Prevista']);
        return dp && dp.y === anoAlvo;
      }
      // Sem data prevista: aceitar somente se for ano atual (dados legados)
      return anoAlvo === anoAtual;
    });
    const obrConcluidas    = obrFiltradas.filter(o => o['Concluída'] === true).length;
    const taxaObrigacoes   = obrFiltradas.length > 0
      ? Math.round((obrConcluidas / obrFiltradas.length) * 100) : null;
    const obrConcluidasAno = obrigacoes.filter(o => o['Concluída'] === true).length;

    // ── MISSÕES ────────────────────────────────────────────
    // Todos do ano
    const missoesDoAno = missoes.filter(m => {
      const ini = parseMA(m['Data Início']);
      return ini && ini.y === anoAlvo;
    });

    // Mensal: início no mês+ano E (sem fim OU fim no mesmo mês+ano)
    const missoesMensal = missoesDoAno.filter(m => {
      if (!eqMA(m['Data Início'], mesIdx, anoAlvo)) return false;
      const fim = parseMA(m['Data Fim']);
      if (!fim) return true; // sem fim → mensal
      return fim.m === mesIdx && fim.y === anoAlvo;
    });

    // Anual: tudo do ano que não é mensal
    const missoesMensalIds = new Set(missoesMensal.map(m => m['ID']));
    const missoesAnual = missoesDoAno.filter(m => !missoesMensalIds.has(m['ID']));

    const missoesMensalConc   = missoesMensal.filter(m => m['Status'] === 'Concluída').length;
    const missoesAnualConc    = missoesAnual.filter(m  => m['Status'] === 'Concluída').length;
    const txMissoesMensal     = missoesMensal.length > 0
      ? Math.round((missoesMensalConc  / missoesMensal.length) * 100) : null;
    const txMissoesAnual      = missoesAnual.length  > 0
      ? Math.round((missoesAnualConc   / missoesAnual.length)  * 100) : null;

    // ── TRATADOS ───────────────────────────────────────────
    const tratadosDoAno = tratados.filter(t => {
      const ini = parseMA(t['Data']);
      return ini && ini.y === anoAlvo;
    });

    const tratadosMensal = tratadosDoAno.filter(t => {
      if (!eqMA(t['Data'], mesIdx, anoAlvo)) return false;
      const fim = parseMA(t['Prazo']);
      if (!fim) return true;
      return fim.m === mesIdx && fim.y === anoAlvo;
    });

    const tratadosMensalIds = new Set(tratadosMensal.map(t => t['ID']));
    const tratadosAnual = tratadosDoAno.filter(t => !tratadosMensalIds.has(t['ID']));

    const tratadosMensalCump  = tratadosMensal.filter(t => t['Status'] === 'Cumprido').length;
    const tratadosAnualCump   = tratadosAnual.filter(t  => t['Status'] === 'Cumprido').length;
    const txTratadosMensal    = tratadosMensal.length > 0
      ? Math.round((tratadosMensalCump / tratadosMensal.length) * 100) : null;
    const txTratadosAnual     = tratadosAnual.length  > 0
      ? Math.round((tratadosAnualCump  / tratadosAnual.length)  * 100) : null;

    // ── ÍNDICE GERAL (só itens mensais) ────────────────────
    let soma = 0, divisor = 0;
    if (taxaObrigacoes   !== null) { soma += taxaObrigacoes;   divisor++; }
    if (txMissoesMensal  !== null) { soma += txMissoesMensal;  divisor++; }
    if (txTratadosMensal !== null) { soma += txTratadosMensal; divisor++; }
    const indiceGeral = divisor > 0 ? Math.round(soma / divisor) : null;

    // ── TESOURO ────────────────────────────────────────────
    let tesouroFinanceiro = 0, ativosIntelectuais = 0;
    const dadosGraficoTesouro = {};

    tesouro.forEach(t => {
      const val = Number(t['Valor Financeiro']) || 0;
      if (t['Tipo'] === 'Financeiro' || t['Tipo'] === 'Retirada') tesouroFinanceiro += val;
      if (t['Tipo'] === 'Intelectual') ativosIntelectuais++;
      if (t['Data'] && val !== 0 && (t['Tipo'] === 'Financeiro' || t['Tipo'] === 'Retirada')) {
        const dateObj = new Date(t['Data']);
        if (!isNaN(dateObj)) {
          const key = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), 'MM/yyyy');
          dadosGraficoTesouro[key] = (dadosGraficoTesouro[key] || 0) + val;
        }
      }
    });

    return {
      success: true,
      mesAlvo, anoAlvo,
      // Obrigações
      taxaObrigacoes, obrTotal: obrFiltradas.length, obrConcluidas, obrConcluidasAno,
      // Missões mensais
      txMissoesMensal, missoesMensalConc, missoesMensalTotal: missoesMensal.length,
      // Missões anuais
      txMissoesAnual, missoesAnualConc, missoesAnualTotal: missoesAnual.length,
      // Tratados mensais
      txTratadosMensal, tratadosMensalCump, tratadosMensalTotal: tratadosMensal.length,
      // Tratados anuais
      txTratadosAnual, tratadosAnualCump, tratadosAnualTotal: tratadosAnual.length,
      // Índice geral
      indiceGeral,
      // Tesouro
      tesouroFinanceiro, ativosIntelectuais, dadosGraficoTesouro
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

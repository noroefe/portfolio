function doGet() {
  initSheets();
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Sistema de Fluxo de Caixa')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function initSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetsConfig = {
    'LANCAMENTOS': ['Data', 'Tipo', 'Categoria', 'Descrição', 'Forma de Pagamento', 'Valor', 'Competência', 'Observação'],
    'CONTAS_A_PAGAR': ['Vencimento', 'Categoria', 'Descrição', 'Valor', 'Status', 'Data de Pagamento'],
    'CONTAS_A_RECEBER': ['Vencimento', 'Cliente', 'Descrição', 'Valor', 'Status', 'Data de Recebimento'],
    'RESUMO_DIARIO': ['Data', 'Total de Entradas', 'Total de Saídas', 'Saldo do Dia'],
    'CONFIG': ['Lista de Categorias', 'Lista de Formas de Pagamento', 'Lista de Tipos', 'Saldo Inicial']
  };

  for (let sheetName in sheetsConfig) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, sheetsConfig[sheetName].length).setValues([sheetsConfig[sheetName]]);
      sheet.getRange(1, 1, 1, sheetsConfig[sheetName].length).setFontWeight("bold");
      if(sheetName === 'CONFIG') {
        sheet.getRange(2, 1, 4, 4).setValues([
          ['Vendas', 'Dinheiro', 'Entrada', 0],
          ['Serviços', 'PIX', 'Saída', ''],
          ['Alimentação', 'Cartão de Crédito', '', ''],
          ['Contas Fixas', 'Cartão de Débito', '', '']
        ]);
      }
    }
  }
}

function getAllData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    return JSON.stringify({
      config: getConfigData(ss.getSheetByName('CONFIG')),
      lancamentos: getSheetData(ss.getSheetByName('LANCAMENTOS')),
      pagar: getSheetData(ss.getSheetByName('CONTAS_A_PAGAR')),
      receber: getSheetData(ss.getSheetByName('CONTAS_A_RECEBER'))
    });
  } catch (e) {
    throw new Error("Erro ao buscar dados: " + e.message);
  }
}

function getConfigData(sheet) {
  const data = sheet.getDataRange().getValues();
  let config = { categorias: [], formasPagamento: [], tipos: [], saldoInicial: 0 };
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) config.categorias.push(data[i][0]);
      if (data[i][1]) config.formasPagamento.push(data[i][1]);
      if (data[i][2]) config.tipos.push(data[i][2]);
    }
    config.saldoInicial = parseFloat(data[1][3]) || 0;
  }
  return config;
}

function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  let result = [];
  for (let i = 1; i < data.length; i++) {
    let rowObj = { _rowIndex: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      if (val instanceof Date) {
        val = val.toISOString().split('T')[0];
      }
      rowObj[headers[j]] = val;
    }
    result.push(rowObj);
  }
  return result;
}

function saveRecord(sheetName, recordData, rowIndex) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    let rowValues = headers.map(header => {
      let val = recordData[header] || '';
      if (header.toLowerCase().includes('valor')) val = Math.abs(parseFloat(val) || 0);
      return val;
    });
    if (rowIndex) {
      sheet.getRange(rowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
    if (sheetName === 'LANCAMENTOS') {
      updateResumoSheet(ss);
    }
    return true;
  } catch (e) {
    throw new Error("Erro ao salvar: " + e.message);
  }
}

function updateResumoSheet(ss) {
  const lanSheet = ss.getSheetByName('LANCAMENTOS');
  const resumoSheet = ss.getSheetByName('RESUMO_DIARIO');
  const configSheet = ss.getSheetByName('CONFIG');
  const data = lanSheet.getDataRange().getValues();
  const saldoInicial = parseFloat(configSheet.getRange(2, 4).getValue()) || 0;
  if (data.length <= 1) return;
  let resumo = {};
  for (let i = 1; i < data.length; i++) {
    let dataLan = Utilities.formatDate(new Date(data[i][0]), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
    let tipo = data[i][1].toString().toLowerCase();
    let valor = parseFloat(data[i][5]) || 0;
    if (!resumo[dataLan]) resumo[dataLan] = { entradas: 0, saidas: 0 };
    if (tipo === 'entrada') resumo[dataLan].entradas += valor;
    else resumo[dataLan].saidas += valor;
  }
  let rows = [];
  let datasOrdenadas = Object.keys(resumo).sort();
  datasOrdenadas.forEach(d => {
    let saldoDia = resumo[d].entradas - resumo[d].saidas;
    rows.push([new Date(d + "T12:00:00Z"), resumo[d].entradas, resumo[d].saidas, saldoDia]);
  });
  resumoSheet.getRange(2, 1, resumoSheet.getLastRow() > 1 ? resumoSheet.getLastRow() - 1 : 1, 4).clearContent();
  if (rows.length > 0) {
    resumoSheet.getRange(2, 1, rows.length, 4).setValues(rows);
  }
}

function payAccount(sheetName, rowIndex, recordData, lancamentoData) {
  try {
    saveRecord(sheetName, recordData, rowIndex);
    saveRecord('LANCAMENTOS', lancamentoData, null);
    return true;
  } catch(e) {
    throw new Error("Erro ao baixar conta: " + e.message);
  }
}

function deleteRecord(sheetName, rowIndex) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName).deleteRow(rowIndex);
    return true;
  } catch(e) {
    throw new Error("Erro ao deletar: " + e.message);
  }
}
const db = require('../config/database');

class Projeto {
    constructor(nomeDoProjeto, etapaAtual, usuarioId, prazoProjeto, objetivosProjeto, numeroTarefas, tipoEncerramento) {
        this.nomeDoProjeto = nomeDoProjeto;
        this.etapaAtual = etapaAtual;
        this.usuarioId = usuarioId;
        this.prazoProjeto = prazoProjeto;
        this.objetivosProjeto = objetivosProjeto;
        this.numeroTarefas = numeroTarefas;
        this.tipoEncerramento = tipoEncerramento;
    }

    // Métodos para  criar, atualizar e listar projetos
  
    static criarProjeto(dadosProjeto, callback) {
        console.log("Dados recebidos para criação do projeto:", dadosProjeto);
        const query = "INSERT INTO tb_projetos (NomeDoProjeto, EtapaAtual, Usuario_id, PrazoProjeto, ObjetivosProjeto, NumeroTarefas, TipoEncerramento) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(query, [dadosProjeto.nomeDoProjeto, dadosProjeto.etapaAtual, dadosProjeto.usuarioId, dadosProjeto.prazoProjeto, dadosProjeto.objetivosProjeto, dadosProjeto.numeroTarefas, dadosProjeto.tipoEncerramento], callback);
    }

    static atualizarProjeto(idProjeto, dadosProjeto, callback) {
        const query = "UPDATE tb_projetos SET NomeDoProjeto = ?, EtapaAtual = ?, Usuario_id = ?, PrazoProjeto = ?, ObjetivosProjeto = ?, NumeroTarefas = ?, TipoEncerramento = ? WHERE idProjeto = ?";
        db.query(query, [dadosProjeto.nomeDoProjeto, dadosProjeto.etapaAtual, dadosProjeto.usuarioId, dadosProjeto.prazoProjeto, dadosProjeto.objetivosProjeto, dadosProjeto.numeroTarefas, dadosProjeto.tipoEncerramento, idProjeto], callback);
    }

    static listarTodos(callback) {
        const query = `
            SELECT 
                p.idProjeto, 
                p.NomeDoProjeto,
                p.EtapaAtual,
                CONCAT(u.Nome, ' ', u.Sobrenome) AS nomeUsuario, 
                p.PrazoProjeto, 
                p.NumeroTarefas  
            FROM 
                tb_projetos p 
                JOIN tb_usuarios u ON p.Usuario_id = u.Matricula_id
            WHERE 
                p.TipoEncerramento = 'Em Aberto'
        `;
        db.query(query, callback);
    }

    static listarProjetosEncerrados(callback) {
        const query = `
            SELECT 
                p.idProjeto, 
                p.NomeDoProjeto,
                p.EtapaAtual,
                CONCAT(u.Nome, ' ', u.Sobrenome) AS nomeUsuario, 
                p.PrazoProjeto, 
                p.NumeroTarefas  
            FROM 
                tb_projetos p 
                JOIN tb_usuarios u ON p.Usuario_id = u.Matricula_id
            WHERE 
                p.TipoEncerramento <> 'Em Aberto'
        `;
        db.query(query, callback);
    }
    
    static listarProjetos(callback) {
        const query = "SELECT * FROM tb_projetos";
        db.query(query, callback);
    }


    static buscarPorId(id, callback) {
        // Consulta com JOIN para trazer os detalhes do usuário
        const sql = `
            SELECT p.*, u.Nome, u.Sobrenome 
            FROM tb_projetos p
            INNER JOIN tb_usuarios u ON p.Usuario_id = u.Matricula_id
            WHERE p.idProjeto = ?`;

        db.query(sql, [id], callback);

        
    }

    static exibirProjeto(idProjeto, callback) {
        const query = `SELECT * FROM tb_projetos WHERE idProjeto = ?`;
        db.query(query, [idProjeto], callback);
    }

}



module.exports = Projeto;

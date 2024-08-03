const db = require('../config/database');

class Tarefa {
    constructor(nomeDaTarefa, usuarioIdTarefa, situacaoTarefa, projetoId, tipoTarefa, descricao, prazoTarefa, excluida) {
        this.nomeDaTarefa = nomeDaTarefa;
        this.usuarioIdTarefa = usuarioIdTarefa;
        this.situacaoTarefa = situacaoTarefa;
        this.projetoId = projetoId;
        this.tipoTarefa = tipoTarefa;
        this.descricao = descricao;
        this.prazoTarefa = prazoTarefa;
        this.excluida = excluida;
    }

    // Método para criar uma nova tarefa
    static criarTarefa(dadosTarefa, callback) {
        const queryInserirTarefa = `
            INSERT INTO tb_tarefas (NomeDaTarefa, Usuario_id_tarefa, SituacaoTarefa, Projeto_id, TipoTarefa, Descricao, PrazoTarefa, Excluida) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
    
        db.query(queryInserirTarefa, [
            dadosTarefa.nomeDaTarefa, 
            dadosTarefa.usuarioIdTarefa, 
            dadosTarefa.situacaoTarefa, 
            dadosTarefa.projetoId, 
            dadosTarefa.tipoTarefa, 
            dadosTarefa.descricao, 
            dadosTarefa.prazoTarefa, 
            dadosTarefa.excluida
        ], (error, results) => {
            if (error) {
                return callback(error);
            }
    
            // Após a inserção da tarefa, incrementar NumeroTarefas no projeto correspondente
            const queryAtualizarProjeto = `
                UPDATE tb_projetos 
                SET NumeroTarefas = NumeroTarefas + 1 
                WHERE idProjeto = ?
            `;
    
            db.query(queryAtualizarProjeto, [dadosTarefa.projetoId], (err, res) => {
                callback(err, results);
            });
        });
    }

    // Método para atualizar uma tarefa
    static atualizarTarefa(idTarefa, dadosTarefa, callback) {
        const query = `
            UPDATE tb_tarefas 
            SET NomeDaTarefa = ?, Usuario_id_tarefa = ?, SituacaoTarefa = ?, Projeto_id = ?, TipoTarefa = ?, Descricao = ?, PrazoTarefa = ?, Excluida = ? 
            WHERE idTarefa = ?
        `;
        db.query(query, [
            dadosTarefa.nomeDaTarefa, 
            dadosTarefa.usuarioIdTarefa, 
            dadosTarefa.situacaoTarefa, 
            dadosTarefa.projetoId, 
            dadosTarefa.tipoTarefa, 
            dadosTarefa.descricao, 
            dadosTarefa.prazoTarefa, 
            dadosTarefa.excluida,
            idTarefa
        ], callback);
    }

    // Método para listar tarefas
    static listarTarefas(callback) {
        const query = "SELECT * FROM tb_tarefas WHERE Excluida = 'Não'";
        db.query(query, callback);
    }

    // Método para buscar uma tarefa por ID
    static buscarPorId(idTarefa, callback) {
        const query = `
            SELECT 
                t.*, 
                p.NomeDoProjeto, 
                u.Nome, 
                u.Sobrenome
            FROM tb_tarefas t
            JOIN tb_projetos p ON t.Projeto_id = p.idProjeto
            JOIN tb_usuarios u ON t.Usuario_id_tarefa = u.Matricula_id
            WHERE t.idTarefa = ?
        `;
    
        db.query(query, [idTarefa], callback);
    }
    

    // Método para excluir (ou marcar como excluída) uma tarefa
    static excluirTarefa(idTarefa, callback) {
        const query = "UPDATE tb_tarefas SET Excluida = 'Sim' WHERE idTarefa = ?";
        db.query(query, [idTarefa], callback);
    }


    static buscarTarefaPorProjeto(projetoId, callback) {
        const query = `
            SELECT 
                t.idTarefa, 
                t.NomeDaTarefa, 
                t.PrazoTarefa, 
                t.SituacaoTarefa, 
                t.TipoTarefa, 
                u.Nome, 
                u.Sobrenome,
                p.NomeDoProjeto
            FROM tb_tarefas t
            JOIN tb_usuarios u ON t.Usuario_id_tarefa = u.Matricula_id
            JOIN tb_projetos p ON t.Projeto_id = p.idProjeto
            WHERE t.Projeto_id = ? AND t.Excluida = 'Não'
        `;
    
        db.query(query, [projetoId], callback);
    }
}


module.exports = Tarefa;


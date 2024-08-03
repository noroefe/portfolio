const db = require('../config/database');

class comentarioTarefa {
    constructor(idComentarioTarefa, Usuario_id_comentario_tarefa, Data_Comentario_Tarefa, Comentario_Tarefa, Tarefa_id) {
        this.idComentarioTarefa = idComentarioTarefa;
        this.Usuario_id_comentario_tarefa = Usuario_id_comentario_tarefa;
        this.Data_Comentario_Tarefa = Data_Comentario_Tarefa;
        this.Comentario_Tarefa = Comentario_Tarefa;
        this.Tarefa_id = Tarefa_id;
    }

    // Métodos para  criar e listar
  
    static comentarTarefa(ComentarioT, callback) {
        console.log("Dados recebidos para Comentário da Tarefa:", ComentarioT);
            // Convertendo a data para o formato AAAA-MM-DD
        const dataFormatada = new Date().toISOString().split('T')[0];
        const query = "INSERT INTO tb_comentarios_tarefas (Usuario_id_comentario_tarefa, Data_Comentario_Tarefa, Comentario_Tarefa, Tarefa_id) VALUES (?, ?, ?, ?)";
        db.query(query, [ComentarioT.Usuario_id_comentario_tarefa, dataFormatada, ComentarioT.Comentario_Tarefa, ComentarioT.Tarefa_id], callback);
        
    }

    static listarComentariosTarefa(callback) {
        db.query('SELECT idComentarioTarefa, Usuario_id_comentario_tarefa, Data_Comentario_Tarefa, Comentario_Tarefa, Tarefa_id FROM tb_comentarios_tarefas', callback);
    }

   static buscarComentariosPorTarefa(tarefaId, callback) {
    const query = `
        SELECT c.*, u.Nome, u.Sobrenome 
        FROM tb_comentarios_tarefas c
        JOIN tb_usuarios u ON c.Usuario_id_comentario_tarefa = u.Matricula_id
        WHERE c.Tarefa_id = ?`;

    db.query(query, [tarefaId], callback);
}

}
module.exports = comentarioTarefa;
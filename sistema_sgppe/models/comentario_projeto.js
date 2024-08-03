const db = require('../config/database');

class comentarioProjeto {
    constructor(idComentarioProjeto, Usuario_id_comentario_proj, Data_Comentario_Projeto, Comentario_Projeto, Projeto_id_comentario) {
        this.idComentarioProjeto = idComentarioProjeto;
        this.Usuario_id_comentario_proj = Usuario_id_comentario_proj;
        this.Data_Comentario_Projeto = Data_Comentario_Projeto;
        this.Comentario_Projeto = Comentario_Projeto;
        this.Projeto_id_comentario = Projeto_id_comentario;
    }

    // Métodos para  criar e listar
  
    static comentarProjeto(ComentarioP, callback) {
        console.log("Dados recebidos para Comentário do Projeto:", ComentarioP);
            // Convertendo a data para o formato AAAA-MM-DD
        const dataFormatada = new Date().toISOString().split('T')[0];
        const query = "INSERT INTO tb_comentarios_projetos (Usuario_id_comentario_proj, Data_Comentario_Projeto, Comentario_Projeto, Projeto_id_comentario) VALUES (?, ?, ?, ?)";
        db.query(query, [ComentarioP.Usuario_id_comentario_proj, dataFormatada, ComentarioP.Comentario_Projeto, ComentarioP.Projeto_id_comentario], callback);
        
    }

    static listarComentariosProjeto(callback) {
        db.query('SELECT idComentarioProjeto, Usuario_id_comentario_proj, Data_Comentario_Projeto, Comentario_Projeto, Projeto_id_comentario FROM tb_comentarios_projetos', callback);
    }

   static buscarComentariosPorProjeto(projetoId, callback) {
    const query = `
        SELECT c.*, u.Nome, u.Sobrenome 
        FROM tb_comentarios_projetos c
        JOIN tb_usuarios u ON c.Usuario_id_comentario_proj = u.Matricula_id
        WHERE c.Projeto_id_comentario = ?`;

    db.query(query, [projetoId], callback);
}

}
module.exports = comentarioProjeto;
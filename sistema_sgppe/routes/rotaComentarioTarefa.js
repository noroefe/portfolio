const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/database');
const comentarioTarefa = require('../models/comentario_tarefa');
const { isAuthenticated } = require('../middleware/authMiddleware'); 

router.post('/adicionar-comentario-tarefa', isAuthenticated, (req, res) => {
    comentarioTarefa.comentarTarefa(req.body, (error) => {
        if (error) {
            // Você pode querer adicionar uma mensagem de erro na query string
            // ou lidar com o erro de outra forma
            console.error("Erro ao adicionar comentário:", error);
            return res.redirect(`/exibir_tarefa/${req.body.Tarefa_id}?error=Erro ao adicionar comentário`);
        } else {
            return res.redirect(`/exibir_tarefa/${req.body.Tarefa_id}?message=Comentário adicionado com sucesso`);
        }
    });
});


// Rota para listar 

router.get('/exibir_tarefa/:id', (req, res) => {
    const idComentarioTarefa = req.params.id;
    
    comentarioTarefa.listarComentariosTarefa(idComentarioTarefa, (error, resultadosComentarioT) => {
        if (error) {
            res.status(500).json({ message: "Erro ao buscar comentários" });
            return;
        }
        if (resultadosComentarioT.length === 0) {
            res.status(404).json({ message: "Comentário não encontrado" });
            return;
        }

        const comentarioDaTarefa = resultadosComentarioT[0];

        // Consulta SQL para obter o nome do usuário responsável
        const sqlUsuario = 'SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?';
        db.query(sqlUsuario, [comentarioDaTarefa.Usuario_id_comentario_tarefa], (err, resultadosUsuario) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                res.send('Erro ao buscar usuário');
                return;
            }

            if (resultadosUsuario.length > 0) {
                const usuario = resultadosUsuario[0];
                ComentarioDaTarefa.Nome = usuario.Nome + ' ' + usuario.Sobrenome;
            } else {
                ComentarioDaTarefa.Nome = 'Usuário não encontrado';
            }

            // Renderiza a página de detalhes do projeto com os detalhes do projeto e do usuário
            res.render('../views/exibir_tarefa', { comentarioT: ComentarioDaTarefa });
        });
    });
});



module.exports = router;
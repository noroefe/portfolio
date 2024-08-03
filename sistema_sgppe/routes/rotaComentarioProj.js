const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/database');
const comentarioProjeto = require('../models/comentario_projeto');
const { isAuthenticated } = require('../middleware/authMiddleware'); 

router.post('/adicionar-comentario', isAuthenticated, (req, res) => {
    comentarioProjeto.comentarProjeto(req.body, (error) => {
        if (error) {
            // Você pode querer adicionar uma mensagem de erro na query string
            // ou lidar com o erro de outra forma
            console.error("Erro ao adicionar comentário:", error);
            return res.redirect(`/exibir-projeto/${req.body.Projeto_id_comentario}?error=Erro ao adicionar comentário`);
        } else {
            return res.redirect(`/exibir-projeto/${req.body.Projeto_id_comentario}?message=Comentário adicionado com sucesso`);
        }
    });
});


// Rota para listar 

router.get('/exibir-projeto/:id', (req, res) => {
    const idComentarioProjeto = req.params.id;
    
    comentarioProjeto.listarComentariosProjeto(idComentarioProjeto, (error, resultadosComentarioP) => {
        if (error) {
            res.status(500).json({ message: "Erro ao buscar comentários" });
            return;
        }
        if (resultadosComentarioP.length === 0) {
            res.status(404).json({ message: "Comentário não encontrado" });
            return;
        }

        const comentario = resultadosComentarioP[0];

        // Consulta SQL para obter o nome do usuário responsável
        const sqlUsuario = 'SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?';
        db.query(sqlUsuario, [comentario.Usuario_id_comentario_proj], (err, resultadosUsuario) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                res.send('Erro ao buscar usuário');
                return;
            }

            if (resultadosUsuario.length > 0) {
                const usuario = resultadosUsuario[0];
                comentario.Nome = usuario.Nome + ' ' + usuario.Sobrenome;
            } else {
                comentario.Nome = 'Usuário não encontrado';
            }

            // Renderiza a página de detalhes do projeto com os detalhes do projeto e do usuário
            res.render('../views/detalhesProjeto', { comentarioP: comentario });
        });
    });
});



module.exports = router;
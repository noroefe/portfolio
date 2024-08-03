const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/database');
const Projeto = require('../models/projeto');
const comentarioProjeto = require('../models/comentario_projeto');
const Tarefa = require('../models/tarefa');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para criar um novo projeto
router.post('/projeto', (req, res) => {
    Projeto.criarProjeto(req.body, (error, results) => {
        if (error) {
            res.status(500).json({ error: true, message: "Erro ao criar projeto" });
        } else {
            res.status(201).json({ error: false, message: "Projeto criado com sucesso!", id: results.insertId });
        }
    });
});
// Rota para atualizar um projeto
router.put('/projeto/:id', (req, res) => {
    const idProjeto = req.params.id;
    Projeto.atualizarProjeto(idProjeto, req.body, (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.status(200).send(`Projeto atualizado com sucesso. ID: ${idProjeto}`);
        }
    });
});

// Rota para exibir a página de edição de projeto
router.get('/edita_projeto/:idProjeto', (req, res) => {
    const idProjeto = req.params.idProjeto;
    
    // Consulta SQL para obter os detalhes do projeto com base no ID
    const sqlProjeto = 'SELECT * FROM tb_projetos WHERE idProjeto = ?';

    db.query(sqlProjeto, [idProjeto], (err, resultadosProjeto) => {
        if (err) {
            console.error('Erro ao buscar projeto para edição:', err);
            res.send('Erro ao buscar projeto para edição');
            return;
        }

        if (resultadosProjeto.length > 0) {
            const projeto = resultadosProjeto[0];
            
            // Consulta SQL para obter o nome do usuário responsável
            const sqlUsuario = 'SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?';
            db.query(sqlUsuario, [projeto.Usuario_id], (err, resultadosUsuario) => {
                if (err) {
                    console.error('Erro ao buscar usuário:', err);
                    res.send('Erro ao buscar usuário');
                    return;
                }

                if (resultadosUsuario.length > 0) {
                    const usuario = resultadosUsuario[0];
                    // Adicionando os detalhes do usuário ao objeto projeto
                    projeto.NomeResponsavel = usuario.Nome + ' ' + usuario.Sobrenome;
                }

                // Renderiza a página de edição de projeto com os detalhes do projeto e do usuário
                res.render('../views/edita_projeto', { project: projeto });
            });
        } else {
            // Projeto não encontrado
            res.send('Projeto não encontrado');
        }
    });
});



// Rota para listar projetos
router.get('/projetos', (req, res) => {
    Projeto.listarTodos((error, projetos) => {
        if (error) {
            res.status(500).json({ message: "Erro ao buscar projetos" });
            return;
        }
        res.status(200).json(projetos);
    });
});

// Rota para listar todos projetos numa página para editar
router.get('/listar-projetos', authMiddleware.isAuthenticated, authMiddleware.hasRequiredEditaProjeto('Sim'), (req, res) => {
    // Consulta SQL para buscar todos os usuários
    const sql = 'SELECT idProjeto, NomeDoProjeto, EtapaAtual FROM tb_projetos';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar projetos:', err);
            res.send('Erro ao buscar projetos');
            return;
        }

        // Renderize a página de lista de usuários com a lista de usuários usando EJS
        res.render('listar-projetos', { projects: results }); // Certifique-se de passar a variável 'projects'
    });
});

router.get('/projetos-encerrados', (req, res) => {
    Projeto.listarProjetosEncerrados((error, projetos) => {
        if (error) {
            res.status(500).json({ message: "Erro ao buscar projetos" });
            return;
        }
        res.status(200).json(projetos);
    });
});

router.get('/projeto/:id', (req, res) => {
    const idProjeto = req.params.id;
    Projeto.buscarPorId(idProjeto, (error, projeto) => {
        if (error) {
            res.status(500).json({ message: "Erro ao buscar o projeto" });
            return;
        }
        if (projeto.length === 0) {
            res.status(404).json({ message: "Projeto não encontrado" });
            return;
        }

        // Renderiza a página de edição de projeto com os detalhes do projeto e do usuário
        res.render('../views/detalhesProjeto', { project: projeto, Matricula_id: req.session.Matricula_id })
    });
});

router.get('/exibir-projeto/:id', (req, res) => {
    const idProjeto = req.params.id;

    Tarefa.buscarTarefaPorProjeto(idProjeto, (err, tarefas) => {
        if (err) {
            // Lidar com o erro como achar melhor
            console.error(err);
            return res.status(500).send("Erro ao buscar tarefas");
        }

    comentarioProjeto.buscarComentariosPorProjeto(idProjeto, (err, comentarios) => {
        if (err) {
            // Lidar com o erro como achar melhor
            console.error(err);
            return res.status(500).send("Erro ao buscar comentários");
        }

    Projeto.exibirProjeto(idProjeto, (error, resultadosProjeto) => {
        if (error) {
            res.status(500).json({ message: "Erro ao buscar o projeto" });
            return;
        }
        if (resultadosProjeto.length === 0) {
            res.status(404).json({ message: "Projeto não encontrado" });
            return;
        }
    
        const projeto = resultadosProjeto[0];
        
        // Consulta SQL para obter o nome do usuário responsável
        const sqlUsuario = 'SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?';
        db.query(sqlUsuario, [projeto.Usuario_id], (err, resultadosUsuario) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                res.send('Erro ao buscar usuário');
                return;
            }

            if (resultadosUsuario.length > 0) {
                const usuario = resultadosUsuario[0];
                projeto.NomeResponsavel = usuario.Nome + ' ' + usuario.Sobrenome;
            } else {
                projeto.NomeResponsavel = 'Responsável não encontrado';
            }

            
            
            // Renderiza a página de detalhes do projeto com os detalhes do projeto e do usuário
            res.render('../views/detalhesProjeto', { project: projeto, comentarios: comentarios, Matricula_id: req.session.Matricula_id, tarefas: tarefas });
            
        });
    });
});
});
});

// Rota para processar a edição do projeto
router.post('/edita_projeto', (req, res) => {
    const { nomeDoProjeto, etapaAtual, usuarioId, prazoProjeto, objetivosProjeto, tipoEncerramento, idProjeto} = req.body;

    // Consulta SQL para atualizar os detalhes do usuário com base no ID
    const sql = 'UPDATE tb_projetos SET NomeDoProjeto = ?, EtapaAtual = ?,  Usuario_id = ?, PrazoProjeto = ?, ObjetivosProjeto = ?, TipoEncerramento = ? WHERE idProjeto = ?';

    db.query(sql, [nomeDoProjeto, etapaAtual, usuarioId, prazoProjeto, objetivosProjeto, tipoEncerramento, idProjeto], (err, results) => {
        if (err) {
            console.error('Erro ao editar projeto:', err);
            res.send('Erro ao editar projeto');
            return;
        }

        // Redirecione para a página de perfil do projeto ou outra página apropriada após a edição
        res.send(`
         <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3">
         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM" crossorigin="anonymous">
         <div class="modal modal-sheet position-static d-block bg-body-secondary p-4 py-md-5" tabindex="-1" role="dialog" id="modalSheet">
         <div class="modal-dialog" role="document">
             <div class="modal-content rounded-4 shadow">
               <div class="modal-header border-bottom-0">
                 <h1 class="modal-title fs-5">AVISO</h1>
               </div>
               <div class="modal-body py-0">
                 <p>Projeto editado com sucesso.</p>
               </div>
               <div class="modal-footer flex-column align-items-stretch w-100 gap-2 pb-3 border-top-0">
                <a href="../public/configuracoes.html"> <button type="button" class="btn btn-lg btn-primary">Voltar</button></a>
               </div>
             </div>
           </div>
           </div>
          `);
    });
});



module.exports = router;
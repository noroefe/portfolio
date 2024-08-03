const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/database');
const Tarefa = require('../models/tarefa');
const comentarioTarefa = require('../models/comentario_tarefa');
const authMiddleware = require('../middleware/authMiddleware');

// Rota para criar uma nova tarefa
router.post('/tarefa', (req, res) => {
    Tarefa.criarTarefa(req.body, (error, results) => {
        if (error) {
            res.status(500).json({ error: true, message: "Erro ao criar tarefa" });
        } else {
            res.status(201).json({ error: false, message: "Tarefa criada com sucesso!", id: results.insertId });
        }
    });
});


// Rota para listar todas tarefas numa página para editar
router.get('/listar-tarefas', authMiddleware.isAuthenticated, authMiddleware.hasRequiredEditaProjeto('Sim'), (req, res) => {
    // Consulta SQL para buscar todos os usuários
    const sql = `
        SELECT 
            t.idTarefa, 
            t.NomeDaTarefa, 
            t.SituacaoTarefa, 
            p.NomeDoProjeto 
        FROM tb_tarefas t
        INNER JOIN tb_projetos p ON t.Projeto_id = p.idProjeto
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar tarefas:', err);
            res.send('Erro ao buscar tarefas');
            return;
        }
        // Renderize a página de lista de usuários com a lista de usuários usando EJS
        res.render('listar-tarefas', { tarefas: results }); // Certifique-se de passar a variável 'tarefa'
    });
});



// Rota para exibir a página de edição de tarefa
router.get('/edita_tarefa/:idTarefa', (req, res) => {
    const idTarefa = req.params.idTarefa;

   // Consulta SQL para obter os detalhes da tarefa e o nome do projeto
   const sqlTarefa = `
   SELECT 
       t.*, 
       p.NomeDoProjeto
   FROM tb_tarefas t
   INNER JOIN tb_projetos p ON t.Projeto_id = p.idProjeto
   WHERE t.idTarefa = ?
`;

    db.query(sqlTarefa, [idTarefa], (err, resultadosTarefa) => {
        if (err) {
            console.error('Erro ao buscar tarefa para edição:', err);
            res.send('Erro ao buscar tarefa para edição');
            return;
        }

        if (resultadosTarefa.length > 0) {
            const tarefa = resultadosTarefa[0];
            
            // Consulta SQL para obter o nome do usuário responsável
            const sqlUsuario = 'SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?';
            db.query(sqlUsuario, [tarefa.Usuario_id_tarefa], (err, resultadosUsuario) => {
                if (err) {
                    console.error('Erro ao buscar usuário:', err);
                    res.send('Erro ao buscar usuário');
                    return;
                }

                if (resultadosUsuario.length > 0) {
                    const usuario = resultadosUsuario[0];
                    // Adicionando os detalhes do usuário ao objeto projeto
                    tarefa.NomeResponsavel = usuario.Nome + ' ' + usuario.Sobrenome;
                }

                // Renderiza a página de edição de projeto com os detalhes do projeto e do usuário
                res.render('../views/edita_tarefa', { tarefa: tarefa });
            });
        } else {
            // Projeto não encontrado
            res.send('Tarefa não encontrada');
        }
    });
});



// Rota para processar a edição da tarefa
router.post('/edita_tarefa', (req, res) => {
    const { nomeDaTarefa, usuarioIdTarefa, situacaoTarefa, projetoId, tipoTarefa, descricao, prazoTarefa, excluida, idTarefa } = req.body;

    // Consulta SQL para atualizar os detalhes do usuário com base no ID
    const sql = 'UPDATE tb_tarefas SET NomeDaTarefa = ?, Usuario_id_tarefa = ?, SituacaoTarefa = ?, Projeto_id = ?, TipoTarefa = ?, Descricao = ?, PrazoTarefa = ?, Excluida = ? WHERE idTarefa = ?';

    db.query(sql, [nomeDaTarefa, usuarioIdTarefa, situacaoTarefa, projetoId, tipoTarefa, descricao, prazoTarefa, excluida, idTarefa], (err, results) => {
        if (err) {
            console.error('Erro ao editar tarefa:', err);
            res.send('Erro ao editar tarefa');
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
                 <p>Tarefa editada com sucesso.</p>
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


//Rota paa exibir tarefas indivualmente
router.get('/exibir_tarefa/:id', (req, res) => {
    const idTarefa = req.params.id;


    Tarefa.buscarPorId(idTarefa, (err, resultadosTarefa) => {
        if (err) {
            // Lidar com o erro como achar melhor
            console.error(err);
            return res.status(500).send("Erro ao buscar tarefa");
        }


    comentarioTarefa.buscarComentariosPorTarefa(idTarefa, (err, TarefaComentarios) => {
        if (err) {
            // Lidar com o erro como achar melhor
            console.error(err);
            return res.status(500).send("Erro ao buscar comentários");
            }


        const tarefas = resultadosTarefa[0];
        
        // Consulta SQL para obter o nome do usuário responsável

 

        const sqlUsuario = 'SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?';
        db.query(sqlUsuario, [tarefas.Usuario_id_tarefa], (err, resultadosUsuario) => {
            if (err) {
                console.error('Erro ao buscar usuário:', err);
                res.send('Erro ao buscar usuário');
                return;
            }

            if (resultadosUsuario.length > 0) {
                const usuario = resultadosUsuario[0];
                tarefas.NomeResponsavel = usuario.Nome + ' ' + usuario.Sobrenome;
            } else {
                tarefas.NomeResponsavel = 'Responsável não encontrado';
            }

            
            
            // Renderiza a página de detalhes da tarefa
            res.render('../views/exibir_tarefa', { tarefas: tarefas, TarefaComentarios: TarefaComentarios, Matricula_id: req.session.Matricula_id });
            
        });
    });
});
});



module.exports = router;
const express = require('express');
const router = express.Router();
const path = require('path');
const db = require('../config/database');
const Usuario = require('../models/usuario');

// Rota para exibir o formulário de login
router.get('/public/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Rota para lidar com o envio do formulário
router.post('/cadastro', (req, res) => {
    const { nome, sobrenome, usuario, senha, cargo, edita_projeto, ativo } = req.body;

    // Insira os dados no banco de dados
    const query = `INSERT INTO tb_usuarios (Nome, Sobrenome, Usuario, Senha, Cargo, Edita_Projeto, Ativo) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [nome, sobrenome, usuario, senha, cargo, edita_projeto, ativo];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao cadastrar usuário:', err);
            res.send('Erro ao cadastrar usuário');
            return;
        }
         // Redireciona para a página inicial após o cadastro
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
                 <p>Usuário cadastrado com sucesso.</p>
               </div>
               <div class="modal-footer flex-column align-items-stretch w-100 gap-2 pb-3 border-top-0">
                <a href="../public/configuracoes.html"> <button type="button" class="btn btn-lg btn-primary">Voltar</button></a>
               </div>
             </div>
           </div>
           </div>
          `);
 } )
        
    });

// Rota para lidar com o envio do formulário de login
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    // Verifique as credenciais no banco de dados (substitua isso com sua lógica de autenticação)
    // Consulta SQL básica para verificar se o usuário e senha correspondem
    const sql = 'SELECT Matricula_id FROM tb_usuarios WHERE usuario = ? AND senha = ? AND Ativo = "Sim"';
    db.query(sql, [usuario, senha], (err, results) => {
        if (err) {
            console.error('Erro ao verificar credenciais:', err);
            res.send('Erro ao verificar credenciais');
            return;
        }

        if (results.length > 0) {
            // Usuário autenticado com sucesso
            const Matricula_id = results[0].Matricula_id;
            res.sendFile(path.join(__dirname, '../public/projetos_abertos.html'));
            // Defina o userId na sessão
            req.session.Matricula_id = Matricula_id;
            
        } else {
            // Credenciais inválidas
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
                    <p>Acesso Negado - Procure o Administrador.</p>
                  </div>
                  <div class="modal-footer flex-column align-items-stretch w-100 gap-2 pb-3 border-top-0">
                   <a href="../public/index.html"> <button type="button" class="btn btn-lg btn-primary">Voltar</button></a>
                  </div>
                </div>
              </div>
              </div>
             `);
    } 
    });
});
// Autenticação

const authMiddleware = require('../middleware/authMiddleware');

// Rota para listar todos os usuários
router.get('/listar-usuarios', authMiddleware.isAuthenticated, authMiddleware.hasRequiredFeature('Gerente de Projetos'), (req, res) => {
    // Consulta SQL para buscar todos os usuários
    const sql = 'SELECT Matricula_id, Nome, Sobrenome FROM tb_usuarios';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuários:', err);
            res.send('Erro ao buscar usuários');
            return;
        }

        // Renderize a página de lista de usuários com a lista de usuários usando EJS
        res.render('listar_usuarios', { users: results }); // Certifique-se de passar a variável 'users'
    });
});
// Rota para exibir a página de edição de usuário
router.get('/editar-usuario/:Matricula_id', (req, res) => {
    // Aqui você pode recuperar os detalhes do usuário com base no ID fornecido
    // e preencher os campos de edição no formulário
    const Matricula_id = req.params.Matricula_id;
    
    // Consulta SQL para obter os detalhes do usuário com base no ID
    const sql = 'SELECT * FROM tb_usuarios WHERE Matricula_id = ?';

    db.query(sql, [Matricula_id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário para edição:', err);
            res.send('Erro ao buscar usuário para edição');
            return;
        }

        if (results.length > 0) {
            // Renderize a página de edição de usuário com os detalhes do usuário
            res.render('../views/edita_usuario', { user: results[0] });
        } else {
            // Usuário não encontrado
            res.send('Usuário não encontrado');
        }
    });
});

// Rota para processar a edição do usuário
router.post('/editar-usuario', (req, res) => {
    const { Nome, Sobrenome, Senha, Cargo, Edita_Projeto, Ativo, Matricula_id} = req.body;

    // Consulta SQL para atualizar os detalhes do usuário com base no ID
    const sql = 'UPDATE tb_usuarios SET Nome = ?, Sobrenome = ?,  Senha = ?, Cargo = ?, Edita_Projeto = ?, Ativo = ? WHERE Matricula_id = ?';

    db.query(sql, [Nome, Sobrenome, Senha, Cargo, Edita_Projeto, Ativo, Matricula_id], (err, results) => {
        if (err) {
            console.error('Erro ao editar usuário:', err);
            res.send('Erro ao editar usuário');
            return;
        }

        // Redirecione para a página de perfil do usuário ou outra página apropriada após a edição
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
                 <p>Usuário editado com sucesso.</p>
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

router.get('/usuarios', (req, res) => {
    Usuario.listarTodos((err, resultado) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.json(resultado);
        }
    });
});

// Rota para fazer logout
router.get('/logout', (req, res) => {
    // Destrua a sessão
    req.session.destroy(err => {
        if (err) {
            console.error('Erro ao encerrar a sessão:', err);
            res.send('Erro ao encerrar a sessão');
            return;
        }
        // Redirecione para a página inicial após o logout
        res.redirect('../public/index.html?message=Logout realizado com sucesso');
    });
});

module.exports = router;
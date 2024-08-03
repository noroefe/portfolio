// authMiddleware.js
const db = require('../config/database');

// Middleware para verificar se o usuário está autenticado
const isAuthenticated = (req, res, next) => {
    // Verifica se há uma sessão ou alguma outra forma de autenticação
    // No exemplo, estou usando a existência de uma variável 'userId' na sessão
    if (req.session.Matricula_id) {
        // O usuário está autenticado, prossiga para a próxima rota
        next();
    } else {
      console.log('Usuário não autenticado');
        // Verifica se a URL não é a de logout para evitar redirecionamentos
        if (req.url !== '/logout') {
            res.redirect('/index.html?message=Você precisa fazer login para acessar esta página');
        } else {
            next();
        }
        // O usuário não está autenticado, redirecione para a página de login
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
                <p>Acesso Negado - Usuário não autenticado!.</p>
              </div>
              <div class="modal-footer flex-column align-items-stretch w-100 gap-2 pb-3 border-top-0">
               <a href="../public/index.html"> <button type="button" class="btn btn-lg btn-primary">Voltar</button></a>
              </div>
            </div>
          </div>
          </div>
         `);
    }
};

// Middleware para verificar características específicas do usuário
const hasRequiredFeature = (Cargo) => {
    return (req, res, next) => {
        // Verifique se o usuário possui a característica necessária
        const Matricula_id = req.session.Matricula_id; // Ou qualquer outra forma de obter o ID do usuário
        const sql = 'SELECT * FROM tb_usuarios WHERE Matricula_id = ? AND Cargo = ?';
        
        db.query(sql, [Matricula_id, Cargo], (err, results) => {
            if (err) {
                console.error('Erro ao verificar características do usuário:', err);
                res.send('Erro ao verificar características do usuário');
                return;
            }

            if (results.length > 0) {
                // O usuário possui a característica necessária, prossiga para a próxima rota
                next();
            } else {
                // O usuário não possui a característica necessária, redirecione ou negue o acesso
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
                        <p>Você não tem permissão para acessar essa página!</p>
                      </div>
                      <div class="modal-footer flex-column align-items-stretch w-100 gap-2 pb-3 border-top-0">
                       <a href="../public/projetos_abertos.html"> <button type="button" class="btn btn-lg btn-primary">Voltar</button></a>
                      </div>
                    </div>
                  </div>
                  </div>
                 `);
            }
        });
    };
};

// Middleware para verificar características específicas do usuário
const hasRequiredEditaProjeto = (Edita_Projeto) => {
  return (req, res, next) => {
      // Verifique se o usuário possui a característica necessária
      const Matricula_id = req.session.Matricula_id; // Ou qualquer outra forma de obter o ID do usuário
      const sql = 'SELECT * FROM tb_usuarios WHERE Matricula_id = ? AND Edita_Projeto = ?';
      
      db.query(sql, [Matricula_id, Edita_Projeto], (err, results) => {
          if (err) {
              console.error('Erro ao verificar características do usuário:', err);
              res.send('Erro ao verificar características do usuário');
              return;
          }

          if (results.length > 0) {
              // O usuário possui a característica necessária, prossiga para a próxima rota
              next();
          } else {
              // O usuário não possui a característica necessária, redirecione ou negue o acesso
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
                      <p>Você não tem permissão para acessar essa página!</p>
                    </div>
                    <div class="modal-footer flex-column align-items-stretch w-100 gap-2 pb-3 border-top-0">
                     <a href="../public/projetos_abertos.html"> <button type="button" class="btn btn-lg btn-primary">Voltar</button></a>
                    </div>
                  </div>
                </div>
                </div>
               `);
          }
      });
  };
};

//Pegar dados do usuário autenticado
const getAuthenticatedUser = (Matricula_id, callback) => {
  db.query('SELECT Nome, Sobrenome FROM tb_usuarios WHERE Matricula_id = ?', [Matricula_id], (err, results) => {
      if (err) {
          return callback(err, null);
      }
      if (results.length > 0) {
          return callback(null, results[0]);
      } else {
          return callback(new Error('Usuário não encontrado'), null);
      }
  });
};


module.exports = { isAuthenticated, hasRequiredFeature, hasRequiredEditaProjeto, getAuthenticatedUser };

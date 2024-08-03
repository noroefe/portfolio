// SGPPE - SISTEMA DE GERENCIAMENTO DE PROJETOS PARA PEQUENAS EMPRESAS

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./config/database'); 
const authMiddleware = require('./middleware/authMiddleware');
const rotaUsuarios = require('./routes/rotaUsuarios');
const rotaProjetos = require('./routes/rotaProjetos');
const rotaComentarioProj = require('./routes/rotaComentarioProj');
const rotaTarefas = require('./routes/rotaTarefas');
const rotaComentarioTarefa = require('./routes/rotaComentarioTarefa');
const app = express();
const path = require('path');


// Servir arquivos estáticos, incluindo imagens
app.use('/public/img', express.static(path.join(__dirname, '/public/img')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json()); // Middleware para analisar JSON


// Configurar o EJS como mecanismo de modelo
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


// Conectar ao banco de dados
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

// Middleware para analisar o corpo das solicitações
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware para criar uma sessão (configure o segredo como necessário)
app.use(session({
    secret: 'seu_segredo_aqui',
    resave: false,
    saveUninitialized: true
}));

/// Middleware para lidar com a mensagem e redirecionamento
app.use((req, res, next) => {
  // Verifica se há uma mensagem na query da URL
  if (req.query.message) {
      res.locals.message = req.query.message;
  }
  next();
});


// Use ROTAS
app.use('/', rotaUsuarios);
app.use('/', rotaProjetos);
app.use('/', rotaTarefas);
app.use('/', rotaComentarioProj);
app.use('/', rotaComentarioTarefa);


// ROTAS PROTEGIDAS:

// Rota PROJETOS ABERTOS
app.get('/public/projetos_abertos.html', authMiddleware.isAuthenticated, (req, res) => {
res.sendFile(path.join(__dirname, '/public/projetos_abertos.html'));
});

// Rota PROJETOS ENCERRADOS
app.get('/public/projetos_encerrados.html', authMiddleware.isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/projetos_encerrados.html'));
  });

// Rota CONFIGURAÇÕES
app.get('/public/configuracoes.html', authMiddleware.isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '/public/configuracoes.html'));
  });

  // Rota Protegida NOVO USUÁRIO
app.get('/public/novo_usuario.html', authMiddleware.isAuthenticated, authMiddleware.hasRequiredFeature('Gerente de Projetos'), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/novo_usuario.html'));
  });

  // Rota Protegida LISTA USUARIOS
  app.get('/listar-usuarios', authMiddleware.isAuthenticated, authMiddleware.hasRequiredFeature('Gerente de Projetos'), (req, res) => {
  res.render(path.join(__dirname, '/listar_usuarios'));
  });

 // Rota Protegida LISTA PROJETOS
  app.get('/listar-projetos', authMiddleware.isAuthenticated, authMiddleware.hasRequiredEditaProjeto('Sim'), (req, res) => {
  res.render(path.join(__dirname, '/listar_projetos'));
  });
    
  // Rota Protegida NOVO PROJETO
  app.get('/public/novo_projeto.html', authMiddleware.isAuthenticated, authMiddleware.hasRequiredFeature('Gerente de Projetos'), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/novo_projeto.html'));
  });

  // Rota Protegida NOVA TAREFA
  app.get('/public/nova_tarefa.html', authMiddleware.isAuthenticated, authMiddleware.hasRequiredEditaProjeto('Sim'), (req, res) => {
  res.sendFile(path.join(__dirname, '/public/nova_tarefa.html'));
  });
    
  // Rota Protegida LISTA TAREFA
  app.get('/listar-tarefas', authMiddleware.isAuthenticated, authMiddleware.hasRequiredEditaProjeto('Sim'), (req, res) => {
  res.sendFile(path.join(__dirname, '/listar-tarefas'));
  });
        
    

app.listen(8080, function () {
  console.log('Porta 8080');
  console.log('link: http://localhost:8080/public/index.html');
});
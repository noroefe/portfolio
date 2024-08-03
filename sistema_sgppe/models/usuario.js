const db = require('../config/database');

class Usuario {
    static listarTodos(callback) {
        db.query('SELECT Matricula_id, Nome, Sobrenome FROM tb_usuarios', callback);
    }
}

module.exports = Usuario;
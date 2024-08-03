const mysql = require('mysql');

// Configuração do banco de dados
const db = mysql.createConnection({
    host     : 'localhost',
    user     : 'admin',
    password : 'admin',
    database : 'norotec',
    port: '3306'
});

module.exports = db;

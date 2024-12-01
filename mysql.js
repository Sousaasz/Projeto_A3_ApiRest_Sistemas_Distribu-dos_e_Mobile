// Importa o módulo "mysql", que permite conectar e interagir com um banco de dados do MySQL.
const mysql = require('mysql');

// Cria uma pool de conexões para gerenciar conexões com o banco de dados.
var pool = mysql.createPool({
    "user": process.env.MYSQL_USER,         // Usuário do banco de dados.
    "password": process.env.MYSQL_PASSWORD, // Senha do banco de dados.
    "database": process.env.MYSQL_DATABASE, // Nome do banco de dados que será acessado.
    "host": process.env.MYSQL_HOST,         // Endereço do servidor onde o banco de dados está hospedado.
    "port": process.env.MYSQL_PORT          // Porta do servidor de banco de dados.
});

// Exporta a pool de conexões para que ela possa ser utilizada em outros arquivos do projeto.
exports.pool = pool;
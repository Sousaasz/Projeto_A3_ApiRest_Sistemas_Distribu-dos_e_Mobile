//Importa o módulo "http" do Node.js é usado para estabelecer um servidor HTTP.
const http = require ('http');

// Importa o arquivo "app", que contém a lógica central da aplicação, incluindo rotas e middlewares.
const app= require('./app');

// Define a porta na qual o servidor irá responder as requisições.
// Primeiro tenta usar a variável de ambiente 'process.env.port', se não estiver definida, usa a porta 3000.
const port = process.env.port || 3000;

// Cria um servidor HTTP e associa a aplicação "app" para responder as requisições.
const server = http.createServer(app);

// Faz o servidor começar a atender as requisições na porta definida.
server.listen(port);


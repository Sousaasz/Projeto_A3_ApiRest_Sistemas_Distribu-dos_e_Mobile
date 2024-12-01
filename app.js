// Importa o modulo Express, usado para criar e gerenciar o servidor e as rotas.
const express = require('express');

// Cria uma instância do Express.
const app = express();

// Importa o módulo Morgan, usado para registrar logs de requisições HTTP.
const morgan = require('morgan');

// Importa o módulo Body-Parser, usado para processar dados do corpo da requisição.
const bodyParser = require('body-parser');

// Importa as rotas específicas para produtos, pedidos e usuários.
const rotaProdutos = require('./routes/produtos');
const rotaPedidos = require('./routes/pedidos');
const rotaUsuarios = require('./routes/usuarios');


// Configura o Morgan para registrar logs no formato "dev".
app.use(morgan('dev'));

// Torna a pasta 'uploads' publica através de requisições HTTP.
app.use('/uploads', express.static('uploads'));

// Configura o Body-Parser para processar dados codificados em URL e em formato JSON.

// Aceita apenas dados simples.
app.use(bodyParser.urlencoded({ extended: false })); 

// Processa as requisições em formato JSON.
app.use(bodyParser.json()); 

// Configura cabeçalhos para lidar com CORS.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permite que qualquer origem acesse a API.
    
    // Define os cabeçalhos permitidos nas requisições.
    res.header(
        'Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    ); 

    // Verifica se a requisição é do tipo OPTIONS.
    if(req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methots', 'PUT, POST, DELETE, GET'); // Permite os métodos HTTP especificados.
        return res.status(200).send ({}); // Retorna uma resposta de sucesso para a requisição OPTIONS.
    }; 

    // Continua para os próximos middlewares ou rotas.
    next();
});

// Registra as rotas específicas para diferentes partes da API.
app.use('/produtos', rotaProdutos);
app.use('/pedidos', rotaPedidos);
app.use('/usuarios', rotaUsuarios);


// Para lidar com erros de rotas não encontradas.
app.use((req, res, next) => {
    const erro = new Error('Não encontrado'); // Cria um erro com a mensagem de "Não encontrado".
    erro.status = 404; // Define o status HTTP como o 404 (não encontrado).
    next(erro); // Encaminha o erro para o próximo middleware.
});

// Para lidar com erros de forma geral.
app.use((error, req, res, next) => {
    res.status(error.status || 500); // Define o status como o do erro ou 500 (erro interno do servidor).
    return res.send({
        erro: {
            mensagem: error.message // Retorna a mensagem de erro.
        }
    });
});

// Exporta o aplicativo configurado para ser usado em outros arquivos (como no servidor).
module.exports = app;
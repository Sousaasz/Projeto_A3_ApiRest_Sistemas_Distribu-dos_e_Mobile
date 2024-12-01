
const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;

// Importa o "multer", um middleware para fazer o upload de arquivos.
const multer = require('multer');

// Importa o middleware de autenticação (login).
const login = require('../middleware/login');

// Configura o armazenamento dos arquivos enviados como as imagens de produtos.
const storage = multer.diskStorage({

    // Define o destino onde os arquivos serão armazenados.
    destination: function (req, file, cb) {
        cb(null, './uploads/'); // Diretório 'uploads' na raiz do projeto.
    },

    // Define o nome do arquivo a ser armazenado, incluindo data e nome original.
    filename: function(req, file, cb) {
        let data = new Date().toISOString().replace(/:/g, '-') + '-';
        cb(null, data + file.originalname );
    }
});

// Configura o filtro de arquivos permitidos para apenas imagens JPEG, JPG ou PNG.
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' ||file.mimetype === "image/jpg"){
        cb(null, true); // Permite o arquivo
    } else {
        cb(null, false); // Rejeita o arquivo
    }
}

// Configura o middleware de upload de arquivos para limite de 10MB e filtro de imagem.
const upload = multer({
    storage: storage, // Usando a configuração de armazenamento definida acima.
    limits: {
        flieSize: 1024 * 1024 * 10 // Limita o tamanho do arquivo a 10MB.
    },
    fileFilter: fileFilter // Aplica o filtro de arquivos permitido.
});


// Rota para retornar todos os produtos
router.get ('/', (req, res, next) => {
   mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send ({error: error})} // Retorna erro de conexão com o banco.
        conn.query(
            'SELECT * FROM produtos;', // Consulta todos os produtos.
            (error, resultado, fields) =>{
                if (error) { return res.status(500).send ({error: error})} // Retorna erro em caso de falha na consulta.
                
                // Formata a resposta com a quantidade de produtos cadastrados e detalhes de cada um.
                const response = {
                    quantidade: resultado.length,
                    produtos: resultado.map(prod => {
                        return {
                            id_produto: prod.id_produto,
                            nome: prod.nome,
                            preco: prod.preco,
                            imagem_produto: prod.imagem_produto,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna os detalhes de um produto em especifico',
                                url: 'http://localhost:3000/produtos/' + prod.id_produto
                            }
                        }
                    }),
                }
                return res.status(200).send(response); // Retorna a lista de produtos.
            }
        );
    });
});

// Rota para inserir um novo produto
router.post('/', login.obrigatorio, upload.single('produto_imagem'), (req, res, next) => {
    console.log(req.usuario); // Exibe os dados do usuário autenticado.
    mysql.getConnection((error, conn) =>{
        if (error) { return res.status(500).send ({error: error})} // Retorna erro de conexão.
        conn.query(
            'INSERT INTO produtos (nome, preco, imagem_produto) VALUES (?,?,?)', // Insere um produto no banco.
            [
                req.body.nome, 
                req.body.preco,
                req.file.path // Caminho do arquivo de imagem enviado.
            ],
            (error, resultado, fields) => {
                conn.release();
                if (error) { return res.status(500).send ({error: error})} // Retorna erro em caso de falha na inserção.
                
                // Resposta com sucesso e detalhes do produto criado.
                const response = {
                    mensagem: 'Produto inserido com sucesso',
                    produtoCriado:{
                        id_produto: resultado.id_produto,
                        nome: req.body.nome,
                        preco: req.body.preco,
                        imagem_produto: req.file.path,
                        request: {
                            tipo: 'Get',
                            descricao: 'Retorna todos os produtos',
                            url: 'http://localhost:3000/produtos'
                        }
                    }
                }
                return res.status(201).send (response); // Retorna sucesso com os dados do produto.
            }
        );
    });
});

// Rota para retornar os dados de um produto específico
router.get ('/:id_produto', (req, res, next) => {
    console.log(req.body); // Exibe os dados recebidos na requisição.
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send ({error: error})} // Retorna erro de conexão.
        conn.query(
            'SELECT * FROM produtos WHERE id_produto = ?;', // Consulta um produto específico pelo ID.
            [req.params.id_produto],
            (error, resultado, fields) => {
                if (error) { return res.status(500).send ({error: error})} // Retorna erro de consulta.
                
                // Caso o produto não exista, retorna um erro 404.
                if (resultado.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado o produto com este ID'
                    });
                }
               
                // Resposta com os detalhes do produto encontrado.
                const response = {
                    produto: {
                        id_produto: resultado[0].id_produto,
                        nome: resultado[0].nome,
                        preco: resultado[0].preco,
                        imagem_produto: resultado[0].imagem_produto,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna todos os produtos',
                            url: 'http://localhost:3000/produtos'
                        }
                    }
                }
                return res.status(200).send(response); // Retorna sucesso com os detalhes do produto.
            }
        );
    });
});

// Rota para atualizar um produto
router.put('/', login.obrigatorio, (req, res, next) => {
    console.log(req.body); // Exibe os dados recebidos para atualização.
    mysql.getConnection((error, conn) =>{
        if (error) { return res.status(500).send ({error: error})} // Retorna erro de conexão.
        conn.query(

            // Atualiza o produto no banco.
            `UPDATE produtos
                SET nome = ?, 
                preco = ?
            WHERE id_produto = ?`,

            [
                req.body.nome, 
                req.body.preco,
                req.body.id_produto
            ],

            (error, resultado, fields) => {
                conn.release();
                if (error) { return res.status(500).send ({error: error})} // Retorna erro de atualização.
                
                // Resposta com sucesso e dados do produto atualizado.
                const response = {
                    mensagem: 'Produto atualizado com sucesso',
                    produtoAtualizado: {
                        id_produto: req.body.id_produto,
                        nome: req.body.nome,
                        preco: req.body.preco,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna os detalhes de um produto especifico',
                            url: 'http://localhost:3000/produtos/' + req.body.id_produto
                        }
                    }
                }

                return res.status(202).send(response); // Retorna sucesso com os dados atualizados.
            }
        );
    });
});

// Rota para excluir um produto
router.delete('/', login.obrigatorio, (req, res, next) => {
    console.log(req.body); // Exibe os dados recebidos para exclusão.
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) } // Retorna erro de conexão.
        conn.query(
            'DELETE FROM produtos WHERE id_produto = ?;', [req.body.id_produto], // Exclui o produto do banco.
            (error, resultado, fields) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) } // Retorna erro de exclusão.

                // Resposta com sucesso e informações sobre o pedido de exclusão.
                const response = {
                    mensagem: "Produto removido com sucesso",
                    request: {
                        tipo: "POST",
                        descrição: "Insira um novo produto",
                        url:  "http://localhost:3000/produtos",
                        body: {
                            nome: 'String',
                            preco: 'Number'
                        }
                    }
                }
                return res.status(202).send(response); // Retorna sucesso com detalhes da operação.
            }
        );
    });
});

// Exporta o roteador para ser usado no arquivo principal app.js.
module.exports = router;

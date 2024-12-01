const express = require('express');
const router = express.Router();
const mysql = require('../mysql').pool;

// Middleware para autenticação via JWT.
const login = require('../middleware/login');

// Rota para retornar todos os pedidos.
router.get ('/', (req, res, next) => {
    mysql.getConnection((error, conn) => {

        // Retorna erro 500 caso haja problema na conexão.
        if (error) { return res.status(500).send ({error: error})}
        conn.query(

                    // Consulta para buscar pedidos com os detalhes do produto associado.          
                    `SELECT pedidos.id_pedido,
                            pedidos.quantidade,
                            produtos.id_produto,
                            produtos.nome,
                            produtos.preco
                       FROM pedidos
                 INNER JOIN produtos
                         ON produtos.id_produto = pedidos.id_produto;`,
            (error, resultado, fields) =>{

                // Retorna erro 500 caso haja problema na consulta.
                if (error) { return res.status(500).send ({error: error})}
                
                // Formata a resposta para retornar os pedidos.
                const response = {
                    quantidadePedidos: resultado.length,
                    pedidos: resultado.map(pedido => {
                        return {
                            id_pedido: pedido.id_pedido,
                            quantidade: pedido.quantidade,
                            produto: {
                                id_produto: pedido.id_produto,
                                nome: pedido.nome,
                                preco: pedido.preco
                            },
                            quantidade: pedido.quantidade,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna os detalhes de um pedido em especifico',
                                url: 'http://localhost:3000/pedidos/' + pedido.id_pedido
                            }
                        }
                    }),
                }
                return res.status(200).send({response});
            }
        );
    });
});

// Rota para inserir um novo pedido.
router.post('/', login.obrigatorio, (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send ({error: error})}

        // Verifica se o produto associado ao pedido existe.
        conn.query("SELECT * FROM produtos WHERE id_produto = ?",
            [req.body.id_produto],
            (error, resultado, fields) => {
            if (error) { return res.status(500).send ({error: error})}
            
            // Retorna erro 404 caso o produto não seja encontrado.
            if (resultado.length == 0) {
                return res.status(404).send({
                    mensagem: 'Produto não encontrado'
                });
            }

            // Insere o pedido na tabela.
            conn.query(
                'INSERT INTO pedidos (id_produto, quantidade) VALUES (?,?)',
                [req.body.id_produto, req.body.quantidade],
                (error, resultado, fields) => {
                    conn.release();
                    if (error) { return res.status(500).send ({error: error})}
                    
                    // Retorna a resposta com detalhes do pedido criado.
                    const response = {
                        mensagem: 'Pedido inserido com sucesso',
                        pedidoCriado:{
                            id_pedido: resultado.id_pedido,
                            id_produto: req.body.id_produto,
                            quantidade: req.body.quantidade,
                            request: {
                                tipo: 'GET',
                                descricao: 'Retorna todos os pedidos',
                                url: 'http://localhost:3000/pedidos'
                            }
                        }
                    }
                    return res.status(201).send(response);
                }
            );

        })
    });
});


// Rota para retornar os detalhes de um pedido específico.
router.get ('/:id_pedido', (req, res, next) => {
    console.log(req.body);
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send ({error: error})}
        conn.query(
            'SELECT * FROM pedidos WHERE id_pedido= ?;',
            [req.params.id_pedido],
            (error, resultado, fields) => {
                if (error) { return res.status(500).send ({error: error})}
                
                // Retorna erro 404 caso o pedido não seja encontrado.
                if (resultado.length == 0) {
                    return res.status(404).send({
                        mensagem: 'Não foi encontrado o pedido com este ID'
                    });
                }

                // Formata a resposta para retornar os detalhes do pedido.
                const response = {
                    pedido: {
                        id_pedido: resultado[0].id_pedido,
                        id_produto: resultado[0].id_produto,
                        quantidade: resultado[0].quantidade,
                        request: {
                            tipo: 'GET',
                            descricao: 'Retorna todos os pedidos',
                            url: 'http://localhost:3000/pedidos'
                        }
                    }
                }
                return res.status(200).send({response})
            }
        );
    }); 
});


// Rota para excluir um pedido.
router.delete('/', login.obrigatorio, (req, res, next) => {
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send({ error: error }) }
        conn.query(

            // Exclui o pedido com base no ID fornecido.
            'DELETE FROM pedidos WHERE id_pedido = ?;', [req.body.id_pedido],
            (error, resultado, fields) => {
                conn.release();
                if (error) { return res.status(500).send({ error: error }) }
                
                // Retorna a resposta indicando que o pedido foi removido com sucesso.
                const response = {
                    mensagem: "Pedido removido com sucesso",
                    request: {
                        tipo: "POST",
                        descrição: "Insira um novo pedido",
                        url:  "http://localhost:3000/pedidos",
                        body: {
                            id_produto: 'Number',
                            quantidade: 'Number'
                        }
                    }
                }
                return res.status(202).send(response);
            }
        );
    });
});


// Exporta o router para ser utilizado em outras partes da aplicação
module.exports = router;

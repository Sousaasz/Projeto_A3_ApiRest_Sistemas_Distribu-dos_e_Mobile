const express = require('express');

// Cria um roteador para organizar as rotas relacionadas a "usuários".
const router = express.Router();

// Importa a pool de conexões ao MySQL do arquivo "mysql.js".
const mysql = require('../mysql').pool;

// Importa o módulo 'bcrypt' para realizar a criptografia de senhas.
const bcrypt = require('bcrypt');

// Importa o módulo 'jsonwebtoken' para criação e verificação de tokens JWT.
const jwt = require('jsonwebtoken');


// Rota para cadastro de usuários.
router.post('/cadastro', (req, res, next) => {

    // Faz Conexão com o banco de dados.
    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send ({error: error})} // Retorna erro em caso de falha.

        // Verifica se já existe um usuário com o mesmo e-mail.
        conn.query('SELECT * FROM usuarios WHERE email = ?', [req.body.email], (error, resultado) => {
            if (error) { return res.status(500).send ({error: error})}
            
            // Se o e-mail já estiver cadastrado, retorna erro de conflito.
            if (resultado.length > 0 ) {
                res.status(409).send ({mensagem: 'Usuario já cadastrado' })
            } else {

                // Criptografa a senha antes de salvá-la no banco de dados.
                bcrypt.hash(req.body.senha, 10, (errBcrypt, hash) => {
                    if (errBcrypt) { return res.status(500).send({ error: errBcrypt})}
                    
                    // Insere o novo usuário no banco de dados.
                    conn.query(
                        'INSERT INTO usuarios (email, senha) VALUES (?,?)', 
                        [req.body.email, hash],
                        (error, resultado) => {
                            conn.release(); // Libera a conexão após a consulta.
                            if(error){ return res.status(500).send ({error: error }) }
                            
                            // Responde com sucesso e retorna os dados do usuário criado.
                            response = {
                                mensagem: 'Usuário criado com sucesso',
                                usuarioCriado: {
                                    id_usuario: resultado.insertId,
                                    email: req.body.email
                                }
                            }
                            return res.status(201).send(response);
                        }
                    );
                });
            }
        });
        
    });
});

// Rota para login de usuários.
router.post('/login', (req, res, next) => {

    mysql.getConnection((error, conn) => {
        if (error) { return res.status(500).send ({error: error})}

        // Busca o usuário pelo e-mail fornecido.
        const query = `SELECT * FROM usuarios WHERE email = ?`;
        conn.query(query, [req.body.email], (error, resultado, fields) => {
            conn.release();
            if (error) {return res.status(500).send({error: error})}

            // Verifica se o usuário existe.
            if (resultado.length < 1 ) {
                return res.status(401).send ({mensagem: 'Falha na autenticação'})
            }
            
            // Compara a senha fornecida com a senha armazenada no banco (criptografada).
            bcrypt.compare(req.body.senha, resultado[0].senha, (err, resultado) => {
                if (err) {
                    return res.status(401).send ({mensagem: 'Falha na autenticação'})
                }
                
                // Se as credenciais forem válidas, gera um token JWT.
                if (resultado) {
                    const token = jwt.sign ({
                        id_usuario: resultado.id_usuario, // ID do usuário.
                        email: resultado.email // E-mail do usuário.
                    }, 
                    process.env.JWT_KEY, // Chave secreta definida nas variáveis de ambiente.
                    { 
                        expiresIn: '2h' // Define o tempo de expiração do token.
                    });

                    // Retorna mensagem de sucesso com o token gerado.
                    return res.status(200).send({
                        mensagem: 'Autenticado com sucesso',
                        token: token
                    });
                }

                return res.status(401).send ({mensagem: 'Falha na autenticação'});
            });
        });
    });
});

// Exporta o roteador para que seja utilizado no arquivo principal (app.js).
module.exports = router;
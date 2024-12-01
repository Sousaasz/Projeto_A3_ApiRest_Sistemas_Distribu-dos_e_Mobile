// Importa a biblioteca JSON Web Token (JWT) para manipulação de tokens de autenticação.
const jwt = require('jsonwebtoken'); 

// Middleware para autenticação obrigatória
exports.obrigatorio = (req, res, next) => {
    
    // Extrai o token do cabeçalho de autorização.
    // O formato esperado do cabeçalho é "Bearer token".
    try {
        const token = req.headers.authorization.split(' ')[1];

        // Verifica e decodifica o token usando a chave secreta definida no ambiente process.env.JWT_KEY
        const decode = jwt.verify(token, process.env.JWT_KEY);

        // Anexa os dados do usuário decodificados ao objeto "req" para uso em rotas subsequentes
        req.usuario = decode;

        // Prossegue para a próxima função middleware ou rota
        next();
    } catch (error) {
        // Caso o token seja inválido ou não fornecido, retorna um erro de autenticação (401)
        return res.status(401).send({mensagem: 'Falha na autenticação'});
    }
};


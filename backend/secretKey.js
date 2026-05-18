require('dotenv').config()

const JWT_SECRET = process.env.JWT_SECRET || 'firma_secreta_por_defecto_para_desafio'

if (!process.env.JWT_SECRET) {
    console.warn("Advertencia: JWT_SECRET no está definido en las variables de entorno. Usando firma por defecto.")
}

module.exports = JWT_SECRET
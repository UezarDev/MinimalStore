const request = require('supertest')
const app = require('../index')
const { pool } = require('../consultas')
const jwt = require('jsonwebtoken')
require('dotenv').config()

describe('SUITE DE PRUEBAS', () => {
    
    let tokenValido;

    beforeAll(() => {
        const payloadPrueba = { id: 1, email: "camila@marketplace.com", role: "client" }
        tokenValido = jwt.sign(payloadPrueba, process.env.JWT_SECRET, { expiresIn: '1h' })
    })

    afterAll(async () => {
        await pool.end()
    });
    // BLOQUE 1: CATEGORÍAS
    describe('GET /categories', () => {
        it('Debería responder con 200 OK y un arreglo', async () => {
            const respuesta = await request(app).get('/categories')
            expect(respuesta.statusCode).toBe(200)
            expect(Array.isArray(respuesta.body)).toBe(true)
        })
    })

    // BLOQUE 2: FAVORITOS
    describe('Módulo de Favoritos (Rutas Autenticadas)', () => {
        
        it('Falla (401) si un usuario intenta ver favoritos sin enviar token', async () => {
            const respuesta = await request(app).get('/favorites')
            
            expect(respuesta.statusCode).toBe(401);
            expect(respuesta.body).toHaveProperty('message')
        })

        it('Éxito (200) al obtener favoritos enviando un Bearer Token válido', async () => {
            const respuesta = await request(app)
                .get('/favorites')
                .set('Authorization', `Bearer ${tokenValido}`)
            
            expect(respuesta.statusCode).toBe(200)
            expect(Array.isArray(respuesta.body)).toBe(true)
        })
    })
})
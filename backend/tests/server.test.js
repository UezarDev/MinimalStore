const request = require('supertest')
const app = require('../index')
const { pool } = require('../consultas')
const jwt = require('jsonwebtoken')
const secretKey = require('../secretKey')
require('dotenv').config()

describe('SUITE DE PRUEBAS', () => {
    
    let tokenValido;

    beforeAll(() => {
        const payloadPrueba = { id: 1, email: "camila@marketplace.com", role: "client" }
        tokenValido = jwt.sign(payloadPrueba, secretKey, { expiresIn: '1h' })
    })

    afterAll(async () => {
        await pool.end()
    });

    // BLOQUE 1: CATEGORÍAS (Ruta 1)
    describe('GET /categories', () => {
        it('Debería responder con 200 OK y un arreglo', async () => {
            const respuesta = await request(app).get('/categories')
            expect(respuesta.statusCode).toBe(200)
            expect(Array.isArray(respuesta.body)).toBe(true)
        })
    })

    // BLOQUE 2: FAVORITOS (Ruta 2)
    describe('Módulo de Favoritos (Rutas Autenticadas)', () => {
        it('Falla (401) si un usuario intenta ver favoritos sin enviar token', async () => {
            const respuesta = await request(app).get('/favorites')
            expect(respuesta.statusCode).toBe(401)
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

    // BLOQUE 3: PRODUCTOS (Ruta 3)
    describe('GET /products', () => {
        it('Debería responder con 200 OK y un arreglo de productos', async () => {
            const respuesta = await request(app).get('/products')
            expect(respuesta.statusCode).toBe(200)
            expect(Array.isArray(respuesta.body)).toBe(true)
        })
    })

    // BLOQUE 4: DETALLE DE PRODUCTO INEXISTENTE (Ruta 4)
    describe('GET /products/:id con ID inexistente', () => {
        it('Debería responder con 404 Not Found al buscar un ID que no existe', async () => {
            const respuesta = await request(app).get('/products/999999')
            expect(respuesta.statusCode).toBe(404)
            expect(respuesta.body).toHaveProperty('message')
        })
    })

    // BLOQUE 5: LOGIN CON CREDENCIALES FALTANTES (Ruta 5)
    describe('POST /login con credenciales faltantes', () => {
        it('Debería responder con 400 Bad Request si no se envía email o password', async () => {
            const respuesta = await request(app)
                .post('/login')
                .send({})
            expect(respuesta.statusCode).toBe(400)
            expect(respuesta.body).toHaveProperty('message')
        })
    })

    // BLOQUE 6: REGISTRO CON CAMPOS FALTANTES (Ruta 6)
    describe('POST /register con campos faltantes', () => {
        it('Debería responder con 400 Bad Request si faltan campos obligatorios', async () => {
            const respuesta = await request(app)
                .post('/register')
                .send({ name: "Solo Nombre" })
            expect(respuesta.statusCode).toBe(400)
            expect(respuesta.body).toHaveProperty('message')
        })
    })
})
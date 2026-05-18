const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const secretKey = require('./secretKey')
const { registrarUsuario,
        verificarUsuario,
        obtenerProductos,
        obtenerProductoPorId,
        crearProducto,
        actualizarProducto,
        eliminarProducto,
        obtenerFavoritos,
        agregarFavorito,
        eliminarFavorito,
        crearOrden,
        obtenerOrdenesPorUsuario,
        obtenerCategorias,
        obtenerUsuarios,
        obtenerUsuarioPorId,
        actualizarUsuario,
        eliminarUsuario,
        crearUsuarioPorAdmin,
        obtenerCategoriaPorId,
        crearCategoria,
        actualizarCategoria,
        eliminarCategoria,
        obtenerOrdenPorId,
        actualizarEstatusOrden,
        eliminarOrden } = require('./consultas')
const { reportarConsulta, verificarToken, esAdmin } = require('./middlewares')

const app = express()
const PORT = process.env.PORT || 3000

// MIDDLEWARES GLOBALES
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}))
app.use(express.json())
app.use(reportarConsulta)

// RUTAS DE AUTENTICACIÓN
// Registro de Usuarios (POST /register)
app.post('/register', async (req, res) => {
    try {
        const usuario = req.body
        await registrarUsuario(usuario)
        
        res.status(201).json({ message: "Usuario registrado exitosamente" })
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message || "Error al registrar el usuario" })
    }
});

// Inicio de Sesión (POST /login)
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        
        const usuarioValido = await verificarUsuario(email, password)
        
        const token = jwt.sign(
            { 
                id: usuarioValido.id, 
                email: usuarioValido.email, 
                role: usuarioValido.role 
            }, 
            secretKey, 
            { expiresIn: '2h' }
        )

        res.status(200).json({
            token: token,
            user: {
                id: usuarioValido.id,
                email: usuarioValido.email,
                role: usuarioValido.role
            }
        })
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message || "Error al iniciar sesión" })
    }
})


// RUTAS DE PRODUCTOS
// Obtener todos los productos (GET /products)
app.get('/products', async (req, res) => {
    try {
        const productos = await obtenerProductos()
        res.status(200).json(productos)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Obtener un producto específico (GET /products/:id)
app.get('/products/:id', async (req, res) => {
    try {
        const { id } = req.params
        const producto = await obtenerProductoPorId(id)
        res.status(200).json(producto)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Crear un producto (POST /products)
app.post('/products', verificarToken, async (req, res) => {
    try {
        const producto = req.body
        const seller_id = req.user.id
        
        const nuevoProducto = await crearProducto(producto, seller_id)
        
        res.status(201).json(nuevoProducto)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Modificar un producto (PUT /products/:id)
app.put('/products/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params
        const producto = req.body
        const seller_id = req.user.id
        
        const productoActualizado = await actualizarProducto(id, producto, seller_id)
        res.status(200).json({ message: "Producto actualizado con éxito", producto: productoActualizado })
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Eliminar un producto (DELETE /products/:id)
app.delete('/products/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params
        const seller_id = req.user.id
        
        const resultado = await eliminarProducto(id, seller_id)
        res.status(200).json(resultado)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// RUTAS DE FAVORITOS (TODAS PROTEGIDAS)
// Obtener favoritos del usuario autenticado (GET /favorites)
app.get('/favorites', verificarToken, async (req, res) => {
    try {
        const user_id = req.user.id
        const favoritos = await obtenerFavoritos(user_id)
        res.status(200).json(favoritos)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Agregar un producto a favoritos (POST /favorites)
app.post('/favorites', verificarToken, async (req, res) => {
    try {
        const user_id = req.user.id
        const { product_id } = req.body
        
        const resultado = await agregarFavorito(user_id, product_id)
        res.status(201).json(resultado)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Quitar un producto de favoritos (DELETE /favorites/:product_id)
app.delete('/favorites/:product_id', verificarToken, async (req, res) => {
    try {
        const user_id = req.user.id
        const { product_id } = req.params
        
        const resultado = await eliminarFavorito(user_id, product_id)
        res.status(200).json(resultado)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// RUTAS DE ÓRDENES DE COMPRA
// Generar una nueva compra (POST /orders)
app.post('/orders', verificarToken, async (req, res) => {
    try {
        const buyer_id = req.user.id
        const { total_price, items } = req.body
        
        const ordenProcesada = await crearOrden(buyer_id, total_price, items)
        res.status(201).json({ message: "Compra realizada con éxito", order_id: ordenProcesada.id })
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// Ver historial de compras del usuario (GET /orders)
app.get('/orders', verificarToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        const historial = await obtenerOrdenesPorUsuario(user_id)
        res.status(200).json(historial)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// RUTAS DE CATEGORÍAS (PÚBLICAS)
// Listar todas las categorías (GET /categories)
app.get('/categories', async (req, res) => {
    try {
        const categorias = await obtenerCategorias()
        res.status(200).json(categorias)
    } catch (error) {
        const statusCode = error.code || 500
        res.status(statusCode).json({ message: error.message })
    }
})

// MÓDULO USERS
app.get('/users', verificarToken, esAdmin, async (req, res) => {
    try { res.status(200).json(await obtenerUsuarios()) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.get('/users/:id', verificarToken, esAdmin, async (req, res) => {
    try { res.status(200).json(await obtenerUsuarioPorId(req.params.id)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.put('/users/:id', verificarToken, async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.id != req.params.id) {
            return res.status(403).json({ message: "No posees autorización para modificar este perfil ajeno." })
        }
        const userAct = await actualizarUsuario(req.params.id, req.body)
        res.status(200).json({ message: "Usuario modificado de manera exitosa", user: userAct })
    } catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.delete('/users/:id', verificarToken, esAdmin, async (req, res) => {
    try { res.status(200).json(await eliminarUsuario(req.params.id)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.post('/users', verificarToken, esAdmin, async (req, res) => {
    try {
        const nuevoUser = await crearUsuarioPorAdmin(req.body)
        res.status(201).json({ message: "Usuario creado exitosamente", id: nuevoUser.id })
    } catch (error) {
        res.status(error.code || 500).json({ message: error.message })
    }
})

// MÓDULO CATEGORIES
app.get('/categories/:id', async (req, res) => {
    try { res.status(200).json(await obtenerCategoriaPorId(req.params.id)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.post('/categories', verificarToken, esAdmin, async (req, res) => {
    try { res.status(201).json(await crearCategoria(req.body.name)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.put('/categories/:id', verificarToken, esAdmin, async (req, res) => {
    try { res.status(200).json(await actualizarCategoria(req.params.id, req.body.name)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.delete('/categories/:id', verificarToken, esAdmin, async (req, res) => {
    try { res.status(200).json(await eliminarCategoria(req.params.id)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

// MÓDULO ORDERS
app.get('/orders/:id', verificarToken, async (req, res) => {
    try { res.status(200).json(await obtenerOrdenPorId(req.params.id)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
});

app.put('/orders/:id', verificarToken, esAdmin, async (req, res) => {
    try {
        const resultado = await actualizarEstatusOrden(req.params.id, req.body.status)
        res.status(200).json({ message: "Estatus de la orden actualizado correctamente", ...resultado })
    } catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})

app.delete('/orders/:id', verificarToken, async (req, res) => {
    try { res.status(200).json(await eliminarOrden(req.params.id)) }
    catch (error) { res.status(error.code || 500).json({ message: error.message }) }
})


// Middleware global para manejar rutas inexistentes
app.use((req, res) => {
    res.status(404).json({ message: "El endpoint solicitado no existe en este servidor." });
});

// LEVANTAR EL SERVIDOR
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
    });
}


module.exports = app
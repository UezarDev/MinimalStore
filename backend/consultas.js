const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false
})

// FUNCIÓN DE REGISTRO
const registrarUsuario = async (usuario) => {
    const { email, name, password, avatar_url, location, phone, role } = usuario

    if (!email || !name || !password) {
        throw { code: 400, message: "Faltan campos obligatorios: email, name y password son requeridos." }
    }

    const salt = bcrypt.genSaltSync(10)
    const passwordEncriptada = bcrypt.hashSync(password, salt)

    const consulta = `
        INSERT INTO Users (email, name, password, avatar_url, location, phone, role) 
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING id, email, name, phone;
    `
    
    const valores = [email, name, passwordEncriptada, avatar_url || null, location || null, phone || null, role || 'client']

    try {
        const resultado = await pool.query(consulta, valores)
        return resultado.rows[0]
    } catch (error) {
        if (error.code === '23505') {
            throw { code: 400, message: "El correo electrónico ya se encuentra registrado." }
        }
        throw { code: 500, message: "Error interno en el servidor al registrar el usuario." }
    }
};

// FUNCIÓN DE LOGIN / VERIFICACIÓN
const verificarUsuario = async (email, password) => {
    if (!email || !password) {
        throw { code: 400, message: "Email y contraseña son requeridos." }
    }

    const consulta = "SELECT * FROM Users WHERE email = $1"
    const valores = [email]

    try {
        const resultado = await pool.query(consulta, valores)
        
        if (resultado.rows.length === 0) {
            throw { code: 401, message: "El correo electrónico no está registrado." }
        }

        const usuario = resultado.rows[0]
        
        const passwordEsCorrecta = bcrypt.compareSync(password, usuario.password)

        if (!passwordEsCorrecta) {
            throw { code: 401, message: "Contraseña incorrecta." }
        }

        return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.name,
            role: usuario.role,
            location: usuario.location,
            phone: usuario.phone,
            avatar_url: usuario.avatar_url
        }

    } catch (error) {
        if (error.code) throw error
        throw { code: 500, message: "Error interno en el servidor al intentar iniciar sesión." }
    }
};

// OBTENER TODOS LOS PRODUCTOS
const obtenerProductos = async () => {
    const consulta = `
        SELECT p.id, p.name, p.price, p.description, p.stock, p.category_id, p.seller_id, p.created_at,
               COALESCE(u.location, p.location, 'No especificada') AS location,
               u.name AS seller_name,
               COALESCE(
                   json_agg(
                       json_build_object('url', pi.url, 'position', pi.position)
                   ) FILTER (WHERE pi.id IS NOT NULL), '[]'
               ) AS images
        FROM Products p
        LEFT JOIN Product_images pi ON p.id = pi.product_id
        LEFT JOIN Users u ON p.seller_id = u.id
        GROUP BY p.id, u.name, u.location
        ORDER BY p.created_at DESC;
    `
    try {
        const { rows } = await pool.query(consulta)
        return rows
    } catch (error) {
        throw { code: 500, message: "Error al consultar los productos en la base de datos." }
    }
};

// OBTENER UN PRODUCTO POR ID
const obtenerProductoPorId = async (id) => {
    const consulta = `
        SELECT p.id, p.name, p.price, p.description, p.stock, p.category_id, p.seller_id, p.created_at,
               COALESCE(u.location, p.location, 'No especificada') AS location,
               u.name AS seller_name,
               u.email AS seller_email,
               u.phone AS seller_phone,
               COALESCE(
                   json_agg(
                       json_build_object('url', pi.url, 'position', pi.position)
                   ) FILTER (WHERE pi.id IS NOT NULL), '[]'
               ) AS images
        FROM Products p
        LEFT JOIN Product_images pi ON p.id = pi.product_id
        LEFT JOIN Users u ON p.seller_id = u.id
        WHERE p.id = $1
        GROUP BY p.id, u.name, u.email, u.phone, u.location;
    `
    try {
        const { rows } = await pool.query(consulta, [id])
        if (rows.length === 0) {
            throw { code: 404, message: "El producto solicitado no existe." }
        }
        return rows[0]
    } catch (error) {
        if (error.code) throw error
        throw { code: 500, message: "Error al buscar el producto en la base de datos." }
    }
}

// CREAR UN NUEVO PRODUCTO
const crearProducto = async (producto, seller_id) => {
    const { name, price, description, stock, category_id, location, images } = producto

    if (!name || !price || !stock || !category_id) {
        throw { code: 400, message: "Faltan campos obligatorios para publicar el producto." };
    }

    const client = await pool.connect()
    
    try {
        await client.query('BEGIN');

        const queryProducto = `
            INSERT INTO Products (name, price, description, stock, category_id, seller_id, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `
        const valoresProducto = [name, price, description || null, stock, category_id, seller_id, location || null]
        const resultadoProducto = await client.query(queryProducto, valoresProducto)
        const nuevoProducto = resultadoProducto.rows[0]

        const imagenesGuardadas = []
        if (images && Array.isArray(images) && images.length > 0) {
            const queryImagen = `
                INSERT INTO Product_images (product_id, url, position)
                VALUES ($1, $2, $3)
                RETURNING url, position;
            `
            
            for (const img of images) {
                const resultadoImagen = await client.query(queryImagen, [nuevoProducto.id, img.url, img.position || 1])
                imagenesGuardadas.push(resultadoImagen.rows[0])
            }
        }

        await client.query('COMMIT')

        return {
            ...nuevoProducto,
            images: imagenesGuardadas
        }

    } catch (error) {
        await client.query('ROLLBACK')
        console.error("Error en la base de datos:", error.message)
        throw { code: 500, message: "Error al guardar el producto y sus imágenes en la base de datos." }
    } finally {
        client.release()
    }
}

// ACTUALIZAR UN PRODUCTO EXISTENTE CON SUS IMÁGENES
const actualizarProducto = async (id, producto, seller_id) => {
    const { name, price, description, stock, category_id, location, images } = producto

    if (!name || !price || !stock || !category_id) {
        throw { code: 400, message: "Faltan campos obligatorios para actualizar el producto." }
    }

    const verificarQuery = "SELECT seller_id FROM Products WHERE id = $1"
    const verificarRes = await pool.query(verificarQuery, [id])

    if (verificarRes.rows.length === 0) {
        throw { code: 404, message: "El producto que intentas actualizar no existe." }
    }

    if (verificarRes.rows[0].seller_id !== seller_id) {
        throw { code: 403, message: "No tienes permisos para modificar este producto." }
    }

    const client = await pool.connect()
    
    try {
        await client.query('BEGIN')

        const queryProducto = `
            UPDATE Products 
            SET name = $1, price = $2, description = $3, stock = $4, category_id = $5, location = $6
            WHERE id = $7
            RETURNING *;
        `
        const valoresProducto = [name, price, description || null, stock, category_id, location || null, id]
        const resultadoProducto = await client.query(queryProducto, valoresProducto)
        const productoActualizado = resultadoProducto.rows[0]

        let imagenesFinales = []

        if (images && Array.isArray(images)) {
            await client.query('DELETE FROM Product_images WHERE product_id = $1;', [id])

            if (images.length > 0) {
                const queryImagen = `
                    INSERT INTO Product_images (product_id, url, position)
                    VALUES ($1, $2, $3)
                    RETURNING url, position;
                `
                for (const img of images) {
                    const resultadoImagen = await client.query(queryImagen, [id, img.url, img.position || 1])
                    imagenesFinales.push(resultadoImagen.rows[0])
                }
            }
        } else {
            const queryExistentes = "SELECT url, position FROM Product_images WHERE product_id = $1 ORDER BY position ASC;"
            const resExistentes = await client.query(queryExistentes, [id])
            imagenesFinales = resExistentes.rows;
        }

        await client.query('COMMIT')

        return {
            ...productoActualizado,
            images: imagenesFinales
        }

    } catch (error) {
        await client.query('ROLLBACK')
        console.error("Error en la actualización de producto:", error.message)
        throw { code: 500, message: "Error interno al actualizar el producto y sus imágenes." }
    } finally {
        client.release()
    }
}

// ELIMINAR UN PRODUCTO
const eliminarProducto = async (id, seller_id) => {
    const verificarQuery = "SELECT seller_id FROM Products WHERE id = $1"
    const verificarRes = await pool.query(verificarQuery, [id])

    if (verificarRes.rows.length === 0) {
        throw { code: 404, message: "El producto que intentas eliminar no existe." }
    }

    if (verificarRes.rows[0].seller_id !== seller_id) {
        throw { code: 403, message: "No tienes permisos para eliminar este producto." }
    }

    const consulta = "DELETE FROM Products WHERE id = $1"
    try {
        await pool.query(consulta, [id])
        return { message: "Producto eliminado exitosamente" }
    } catch (error) {
        throw { code: 500, message: "Error al intentar eliminar el producto de la base de datos." }
    }
}

// OBTENER LOS FAVORITOS DE UN USUARIO
const obtenerFavoritos = async (user_id) => {
    const consulta = `
        SELECT f.id AS favorite_link_id, 
               p.id, p.name, p.price, p.description, p.stock, p.category_id, p.seller_id, p.created_at,
               COALESCE(u.location, p.location, 'No especificada') AS location,
               COALESCE(
                   json_agg(
                       json_build_object('url', pi.url, 'position', pi.position)
                   ) FILTER (WHERE pi.id IS NOT NULL), '[]'
               ) AS images
        FROM User_favorites f
        JOIN Products p ON f.product_id = p.id
        LEFT JOIN Product_images pi ON p.id = pi.product_id
        LEFT JOIN Users u ON p.seller_id = u.id
        WHERE f.user_id = $1
        GROUP BY f.id, p.id, u.location;
    `
    try {
        const { rows } = await pool.query(consulta, [user_id])
        return rows
    } catch (error) {
        throw { code: 500, message: "Error al obtener la lista de favoritos de la base de datos." }
    }
};

// AGREGAR UN PRODUCTO A FAVORITOS
const agregarFavorito = async (user_id, product_id) => {
    if (!product_id) {
        throw { code: 400, message: "El id del producto es requerido." }
    }

    const verificarProducto = "SELECT id FROM Products WHERE id = $1"
    const resProducto = await pool.query(verificarProducto, [product_id])
    if (resProducto.rows.length === 0) {
        throw { code: 404, message: "El producto que intentas agregar a favoritos no existe." }
    }

    const consulta = `
        INSERT INTO User_favorites (user_id, product_id) 
        VALUES ($1, $2) 
        ON CONFLICT (user_id, product_id) DO NOTHING
        RETURNING *;
    `
    try {
        const { rows } = await pool.query(consulta, [user_id, product_id])
        if (rows.length === 0) {
            return { message: "El producto ya se encontraba en tus favoritos." }
        }
        return { message: "Producto añadido a favoritos con éxito.", registro: rows[0] }
    } catch (error) {
        throw { code: 500, message: "Error interno al intentar guardar el favorito." }
    }
}

// ELIMINAR UN PRODUCTO DE FAVORITOS
const eliminarFavorito = async (user_id, product_id) => {
    const consulta = `
        DELETE FROM User_favorites 
        WHERE user_id = $1 AND product_id = $2 
        RETURNING *;
    `
    try {
        const { rows } = await pool.query(consulta, [user_id, product_id])
        if (rows.length === 0) {
            throw { code: 404, message: "El producto no estaba en tu lista de favoritos." }
        }
        return { message: "Producto removido de favoritos exitosamente." }
    } catch (error) {
        if (error.code) throw error
        throw { code: 500, message: "Error interno al eliminar el favorito." }
    }
}

// CREAR UNA ÓRDEN DE COMPRA CON SUS DETALLES
const crearOrden = async (buyer_id, total_price, items) => {
    if (!total_price || !items || !Array.isArray(items) || items.length === 0) {
        throw { code: 400, message: "Faltan datos requeridos para procesar la orden de compra." }
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const queryOrden = `
            INSERT INTO Orders (buyer_id, total_price, status)
            VALUES ($1, $2, 'completed')
            RETURNING id, created_at, total_price, status;
        `
        const resOrden = await client.query(queryOrden, [buyer_id, total_price])
        const nuevaOrden = resOrden.rows[0]

        const queryItem = `
            INSERT INTO order_items (order_id, products_id, quantity, unit_price_at_purchase)
            VALUES ($1, $2, $3, $4);
        `
        const queryStock = `
            UPDATE Products 
            SET stock = stock - $1 
            WHERE id = $2 AND stock >= $1
            RETURNING id, name, stock;
        `

        for (const item of items) {
            const { products_id, quantity, unit_price_at_purchase } = item

            const resStock = await client.query(queryStock, [quantity, products_id])
            if (resStock.rows.length === 0) {
                throw new Error(`Stock insuficiente o producto no encontrado para el ID: ${products_id}`)
            }

            await client.query(queryItem, [nuevaOrden.id, products_id, quantity, unit_price_at_purchase])
        }

        await client.query('COMMIT')
        return nuevaOrden

    } catch (error) {
        await client.query('ROLLBACK')
        console.error("Error en la transacción de la orden:", error.message)
        throw { code: 400, message: error.message || "Error al procesar la orden de compra." }
    } finally {
        client.release()
    }
};

// OBTENER EL HISTORIAL DE ÓRDENES DE UN USUARIO
const obtenerOrdenesPorUsuario = async (user_id) => {
    const consulta = `
        SELECT o.*, 
               COALESCE(
                   json_agg(
                       json_build_object(
                           'item_id', oi.id,
                           'product_id', oi.products_id,
                           'quantity', oi.quantity,
                           'unit_price', oi.unit_price_at_purchase,
                           'product_name', p.name
                       )
                   ), '[]'
               ) AS items
        FROM Orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN Products p ON oi.products_id = p.id
        WHERE o.buyer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC;
    `
    try {
        const { rows } = await pool.query(consulta, [user_id])
        return rows
    } catch (error) {
        throw { code: 500, message: "Error al obtener el historial de órdenes." }
    }
}

// OBTENER TODAS LAS CATEGORÍAS
const obtenerCategorias = async () => {
    const consulta = "SELECT * FROM Categories ORDER BY id ASC;"
    try {
        const { rows } = await pool.query(consulta)
        return rows
    } catch (error) {
        throw { code: 500, message: "Error al obtener las categorías de la base de datos." }
    }
}


// MÓDULO: USERS (ADMIN/PROFILE)
const obtenerUsuarios = async () => {
    const consulta = "SELECT id, name, email, role, location, phone, avatar_url FROM Users;"
    const { rows } = await pool.query(consulta)
    return rows
};

const obtenerUsuarioPorId = async (id) => {
    const consulta = "SELECT id, name, email, role, location, phone, avatar_url FROM Users WHERE id = $1;"
    const { rows } = await pool.query(consulta, [id])
    if (rows.length === 0) throw { code: 404, message: "Usuario no encontrado." }
    return rows[0]
}

const actualizarUsuario = async (id, datos) => {
    const { name, role, location, phone, avatar_url } = datos
    if (!name) throw { code: 400, message: "El nombre es obligatorio." }

    const consulta = `
        UPDATE Users 
        SET name = $1, role = $2, location = $3, phone = $4, avatar_url = $5
        WHERE id = $6
        RETURNING id, name, email, role, location, phone, avatar_url;
    `
    const valores = [name, role || 'client', location || null, phone || null, avatar_url || null, id]
    const { rows } = await pool.query(consulta, valores)
    if (rows.length === 0) throw { code: 404, message: "Usuario no encontrado para actualizar." }
    return rows[0]
}

const eliminarUsuario = async (id) => {
    const consulta = "DELETE FROM Users WHERE id = $1 RETURNING id;"
    const { rows } = await pool.query(consulta, [id])
    if (rows.length === 0) throw { code: 404, message: "El usuario a eliminar no existe." }
    return { message: "Usuario eliminado de forma exitosa." }
}

const crearUsuarioPorAdmin = async (usuario) => {
    const { name, email, role, location, phone, avatar_url } = usuario
    if (!name || !email) throw { code: 400, message: "Nombre y email son obligatorios." }
    
    const passwordTemporal = bcrypt.hashSync("claveTemporal123", 10)
    
    const consulta = `
        INSERT INTO Users (name, email, password, role, location, phone, avatar_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id;
    `
    const valores = [name, email, passwordTemporal, role || 'client', location || null, phone || null, avatar_url || null]
    const { rows } = await pool.query(consulta, valores)
    return rows[0]
}


// MÓDULO: CATEGORIES (ADMIN/DETAIL)
const obtenerCategoriaPorId = async (id) => {
    const consulta = "SELECT * FROM Categories WHERE id = $1;"
    const { rows } = await pool.query(consulta, [id])
    if (rows.length === 0) throw { code: 404, message: "Categoría no encontrada." }
    return rows[0]
}

const crearCategoria = async (name) => {
    if (!name) throw { code: 400, message: "El nombre de la categoría es obligatorio." }
    const consulta = "INSERT INTO Categories (name) VALUES ($1) RETURNING *;"
    const { rows } = await pool.query(consulta, [name])
    return rows[0]
}

const actualizarCategoria = async (id, name) => {
    if (!name) throw { code: 400, message: "El nombre de la categoría es obligatorio." }
    const consulta = "UPDATE Categories SET name = $1 WHERE id = $2 RETURNING *;"
    const { rows } = await pool.query(consulta, [name, id])
    if (rows.length === 0) throw { code: 404, message: "Categoría no encontrada para actualizar." }
    return rows[0]
}

const eliminarCategoria = async (id) => {
    const consulta = "DELETE FROM Categories WHERE id = $1 RETURNING id;"
    const { rows } = await pool.query(consulta, [id])
    if (rows.length === 0) throw { code: 404, message: "La categoría a eliminar no existe." }
    return { message: "Categoría eliminada exitosamente." }
};

// MÓDULO: ORDERS (ADMIN/DETAIL)

const obtenerOrdenPorId = async (id) => {
    const consulta = `
        SELECT o.*, 
               COALESCE(
                   json_agg(
                       json_build_object(
                           'id', oi.id,
                           'products_id', oi.products_id,
                           'quantity', oi.quantity,
                           'unit_price_at_purchase', oi.unit_price_at_purchase
                       )
                   ) FILTER (WHERE oi.id IS NOT NULL), '[]'
               ) AS items
        FROM Orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id;
    `
    const { rows } = await pool.query(consulta, [id])
    if (rows.length === 0) throw { code: 404, message: "Orden de compra no encontrada." }
    return rows[0]
}

const actualizarEstatusOrden = async (id, status) => {
    if (!status) throw { code: 400, message: "El nuevo estatus es requerido." }
    const consulta = "UPDATE Orders SET status = $1 WHERE id = $2 RETURNING id, status;"
    const { rows } = await pool.query(consulta, [status, id])
    if (rows.length === 0) throw { code: 404, message: "Orden de compra no encontrada." }
    return rows[0]
}

const eliminarOrden = async (id) => {
    const consulta = "DELETE FROM Orders WHERE id = $1 RETURNING id;"
    const { rows } = await pool.query(consulta, [id])
    if (rows.length === 0) throw { code: 404, message: "La orden seleccionada no existe." }
    return { message: "Orden eliminada con éxito." }
}

module.exports = {
    pool,
    registrarUsuario,
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
    eliminarOrden
}
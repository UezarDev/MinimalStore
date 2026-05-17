🌿 Minimalist Store - Proyecto Final Bootcamp

Proyecto final para el bootcamp Full Stack JavaScript de Desafío Latam. Consiste en el desarrollo de un e-commerce de artículos minimalistas, diseñado para ofrecer una experiencia de usuario limpia y eficiente.

💻 Desarrolladores

- Camila Cifuentes
- Isaac Montillas

---

## 🚀 Descripción del Proyecto

MinimalStore es una plataforma donde los usuarios pueden comprar y vender artículos con una estética minimalista. El enfoque principal es la simplicidad visual y la facilidad de uso, permitiendo a los usuarios navegar por un catálogo curado, gestionar sus propias publicaciones y guardar sus artículos favoritos.

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React + Vite**: Framework para una interfaz rápida y reactiva.
- **Pico CSS**: Framework CSS minimalista para un diseño limpio y moderno.
- **React Router DOM**: Gestión de navegación y rutas privadas.
- **Context API**: Manejo global del estado de sesión y autenticación.
- **Lucide React**: Set de iconos consistentes y elegantes.

## 📁 Estructura del Frontend

- `src/components/`: Componentes globales como la Navbar y protectores de rutas.
- `src/views/`: Páginas principales (Home, Catálogo, Perfil, Detalle de Producto).
- `src/data/`: Datos de prueba (`mockups.json`) estructurados según el esquema real de la base de datos.
- `src/index.css`: Sistema de diseño basado en variables para un tema oscuro con acentos púrpuras/rosados.

## ✨ Funcionalidades Principales

1.  **Navegación Intuitiva**: Acceso rápido al catálogo y gestión de cuenta.
2.  **Gestión de Publicaciones**: Creación y edición de artículos con soporte para múltiples imágenes.
3.  **Sistema de Favoritos**: Sección dedicada en el perfil para guardar artículos de interés.
4.  **Vista de Detalle**: Carrusel de imágenes y acceso directo a la información del vendedor.
5.  **Autenticación**: Rutas protegidas para asegurar que solo usuarios registrados puedan publicar o ver sus perfiles.

## 📦 Instalación y Uso

1. Clonar el repositorio.
2. Navegar a la carpeta `proyecto-final/frontend`.
3. Instalar dependencias: `npm install`.
4. Ejecutar en modo desarrollo: `npm run dev`.

---

### Backend
- **Node.js + Express**: Servidor rápido, modular y de arquitectura minimalista.
- **PostgreSQL (Neon.tech)**: Base de datos relacional robusta alojada en la nube.
- **JSON Web Tokens (JWT)**: Generación de sesiones seguras y protección de rutas.
- **BcryptJS**: Algoritmo de encriptación segura para contraseñas de usuarios.
- **Jest + Supertest**: Framework y librería para la automatización de pruebas integrales.

## 📁 Estructura del Backend

- `index.js`: Punto de entrada principal, configuración del servidor y endpoints.
- `consultas.js`: Capa de datos con consultas SQL estructuradas y transacciones atómicas.
- `middlewares.js`: Filtros de control (registro de peticiones, validación de JWT y verificación de roles).
- `tests/`: Suite de pruebas automatizadas para la verificación de rutas públicas y protegidas.

## ✨ Funcionalidades Principales

1. **Autenticación Robusta**: Flujo seguro de registro y login con verificación estricta de credenciales.
2. **Control de Acceso (RBAC)**: Middleware especializado para restringir rutas críticas exclusivamente a administradores.
3. **Persistencia de Favoritos**: Registro relacional seguro y eliminación de productos enlazados a la sesión de cada usuario.
4. **Gestión Transaccional**: Procesamiento seguro de órdenes de compra con rebaja de stock en tiempo real y reversión (`rollback`) ante fallos.
5. **Estabilidad del Servidor**: Manejo global de errores 404 y reconexión automática ante la inactividad del pool de base de datos.

## 📦 Instalación y Uso

1. Navegar a la carpeta `proyecto-final/backend`.
2. Duplicar `.env.example`, renombrarlo a `.env` y rellenar con las credenciales correspondientes.
3. Instalar dependencias: `npm install`.
4. Ejecutar en modo desarrollo: `npm run dev`.
5. Correr suite de pruebas: `npm run test`.
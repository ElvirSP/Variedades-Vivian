// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Importar la configuración de la base de datos
const sequelize = require('./config/database');
const models = require('./models');
const crearUsuarioInicial = require('./utils/crearUsuarioInicial');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const devolucionRoutes = require('./routes/devolucionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/devoluciones', devolucionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API de Tienda de Variedades funcionando' });
});

// Función para iniciar el servidor
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    await sequelize.sync();
    console.log('Modelos sincronizados con la base de datos.');
    
    await crearUsuarioInicial();
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log('📚 Rutas disponibles:');
      console.log('🔐 AUTENTICACIÓN:');
      console.log('   POST /api/auth/login - Iniciar sesión');
      console.log('   GET  /api/auth/perfil - Obtener perfil');
      console.log('   PUT  /api/auth/perfil - Actualizar perfil');
      console.log('   PUT  /api/auth/cambiar-password - Cambiar contraseña');
      console.log('📦 PRODUCTOS:');
      console.log('   GET  /api/productos - Listar productos');
      console.log('   GET  /api/productos/stock-bajo - Productos con stock bajo');
      console.log('   GET  /api/productos/:id - Obtener producto');
      console.log('   POST /api/productos - Crear producto');
      console.log('   PUT  /api/productos/:id - Actualizar producto');
      console.log('   DELETE /api/productos/:id - Eliminar producto');
      console.log('🏷️  CATEGORÍAS:');
      console.log('   GET  /api/categorias - Listar categorías');
      console.log('   GET  /api/categorias/:id - Obtener categoría');
      console.log('   POST /api/categorias - Crear categoría');
      console.log('   PUT  /api/categorias/:id - Actualizar categoría');
      console.log('   DELETE /api/categorias/:id - Eliminar categoría');
      console.log('🏢 PROVEEDORES:');
      console.log('   GET  /api/proveedores - Listar proveedores');
      console.log('   GET  /api/proveedores/:id - Obtener proveedor');
      console.log('   POST /api/proveedores - Crear proveedor');
      console.log('   PUT  /api/proveedores/:id - Actualizar proveedor');
      console.log('   DELETE /api/proveedores/:id - Eliminar proveedor');
      console.log('💰 VENTAS:');
      console.log('   GET  /api/ventas - Listar ventas');
      console.log('   GET  /api/ventas/estadisticas - Estadísticas de ventas');
      console.log('   GET  /api/ventas/:id - Obtener venta');
      console.log('   POST /api/ventas - Crear venta');
      console.log('   PATCH /api/ventas/:id/estado - Cambiar estado');
      console.log('   DELETE /api/ventas/:id - Eliminar venta');
      console.log('🔄 DEVOLUCIONES:');
      console.log('   GET  /api/devoluciones - Listar devoluciones');
      console.log('   GET  /api/devoluciones/:id - Obtener devolución');
      console.log('   POST /api/devoluciones - Crear devolución');
      console.log('   PATCH /api/devoluciones/:id/procesar - Procesar devolución');
      console.log('   PATCH /api/devoluciones/:id/estado - Cambiar estado');
      console.log('   DELETE /api/devoluciones/:id - Eliminar devolución');
      console.log('📊 DASHBOARD:');
      console.log('   GET  /api/dashboard/resumen - Resumen del dashboard');
      console.log('   GET  /api/dashboard/estadisticas - Estadísticas por período');
      console.log('   GET  /api/dashboard/graficos - Gráficos para dashboard');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
  }
};

startServer();
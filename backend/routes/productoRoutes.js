const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de productos
router.get('/', productoController.obtenerProductos);
router.get('/stock-bajo', productoController.obtenerProductosStockBajo);
router.get('/:id', productoController.obtenerProducto);
router.post('/', productoController.crearProducto);
router.put('/:id', productoController.actualizarProducto);
router.delete('/:id', productoController.eliminarProducto);

module.exports = router;

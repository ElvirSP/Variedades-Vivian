const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de ventas
router.get('/', ventaController.obtenerVentas);
router.get('/estadisticas', ventaController.obtenerEstadisticasVentas);
router.get('/:id', ventaController.obtenerVenta);
router.post('/', ventaController.crearVenta);
router.patch('/:id/estado', ventaController.actualizarEstadoVenta);
router.delete('/:id', ventaController.eliminarVenta);

module.exports = router;

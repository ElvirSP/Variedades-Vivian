const express = require('express');
const router = express.Router();
const devolucionController = require('../controllers/devolucionController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de devoluciones
router.get('/', devolucionController.obtenerDevoluciones);
router.get('/:id', devolucionController.obtenerDevolucion);
router.post('/', devolucionController.crearDevolucion);
router.patch('/:id/procesar', devolucionController.procesarDevolucion);
router.patch('/:id/estado', devolucionController.actualizarEstadoDevolucion);
router.delete('/:id', devolucionController.eliminarDevolucion);

module.exports = router;

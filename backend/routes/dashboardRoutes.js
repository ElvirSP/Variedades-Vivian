const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas del dashboard
router.get('/resumen', dashboardController.obtenerResumen);
router.get('/estadisticas', dashboardController.obtenerEstadisticas);
router.get('/graficos', dashboardController.obtenerGraficos);

module.exports = router;
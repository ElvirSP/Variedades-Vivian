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

// Nuevas rutas para gráficas dinámicas
router.get('/ventas-periodo', dashboardController.obtenerVentasPorPeriodo);
router.get('/categorias-mas-vendidas', dashboardController.obtenerCategoriasMasVendidas);
router.get('/ventas-categoria', dashboardController.obtenerVentasPorCategoria);


// Nuevas rutas para las gráficas mejoradas
router.get('/productos-mas-vendidos', dashboardController.obtenerProductosMasVendidos);
router.get('/ventas-meta', dashboardController.obtenerVentasMeta);
router.get('/devoluciones-mensuales', dashboardController.obtenerDevolucionesMensuales);

// Ruta para recalcular totales
router.post('/recalcular-totales', dashboardController.recalcularTotalesVentas);

// Ruta para reporte consolidado
router.get('/reporte-consolidado', dashboardController.generarReporteConsolidado);

module.exports = router;
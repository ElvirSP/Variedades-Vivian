const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// Rutas de proveedores
router.get('/', proveedorController.obtenerProveedores);
router.get('/:id', proveedorController.obtenerProveedor);
router.post('/', proveedorController.crearProveedor);
router.put('/:id', proveedorController.actualizarProveedor);
router.delete('/:id', proveedorController.eliminarProveedor);

module.exports = router;

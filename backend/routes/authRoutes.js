const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// Rutas públicas
router.post('/login', authController.login);

// Rutas protegidas
router.get('/perfil', auth, authController.obtenerPerfil);
router.put('/perfil', auth, authController.actualizarPerfil);
router.put('/cambiar-password', auth, authController.cambiarPassword);

module.exports = router;
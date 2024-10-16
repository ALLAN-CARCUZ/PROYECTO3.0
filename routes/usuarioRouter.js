const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const router = express.Router();

// Ruta para crear un nuevo usuario (registro)
router.post('/register', usuarioController.createUsuario);
router.post('/login', usuarioController.loginUsuario);

module.exports = router;

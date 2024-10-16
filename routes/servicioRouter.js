// servicioRouter.js
const express = require('express');
const servicioController = require('../controllers/servicioController');
const router = express.Router();

// Ruta para crear un nuevo servicio
router.post('/create', servicioController.createServicio);

// Ruta para obtener todos los servicios
router.get('/', servicioController.getServicios);

// Ruta para actualizar un servicio
router.put('/update/:id', servicioController.updateServicio);

// Ruta para eliminar un servicio
router.delete('/delete/:id', servicioController.deleteServicio);

module.exports = router;

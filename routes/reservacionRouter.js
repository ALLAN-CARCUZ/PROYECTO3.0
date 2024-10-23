const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getReservacionesByUsuario, updateReservacion, deleteReservacion, obtenerReservacionPorId } = require('../controllers/reservacionController');
const reservacionController = require('../controllers/reservacionController');
const router = express.Router();


router.get('/usuario', authenticateToken, getReservacionesByUsuario);
router.post('/create', reservacionController.createReservacion);
//router.put('/update/:id_reservacion', authenticateToken, updateReservacion);
router.put('/update/:id', authenticateToken, updateReservacion);
router.delete('/cancel/:id_reservacion', authenticateToken, deleteReservacion);
router.get('/:id', obtenerReservacionPorId);
router.get('/', authenticateToken, reservacionController.getReservaciones);


module.exports = router;


const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getReservacionesByUsuario, updateReservacion, deleteReservacion } = require('../controllers/reservacionController');
const reservacionController = require('../controllers/reservacionController');
const router = express.Router();


router.get('/usuario', authenticateToken, getReservacionesByUsuario);
router.post('/create', reservacionController.createReservacion);
router.put('/update', authenticateToken, updateReservacion);
router.delete('/cancel/:id_reservacion', authenticateToken, deleteReservacion);

module.exports = router;


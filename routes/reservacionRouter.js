// reservacionRouter.js
const express = require('express');
const reservacionController = require('../controllers/reservacionController');
const router = express.Router();


router.post('/create', reservacionController.createReservacion);
router.get('/', reservacionController.getReservaciones);
router.put('/update/:id', reservacionController.updateReservacion);
router.delete('/delete/:id', reservacionController.deleteReservacion);

module.exports = router;


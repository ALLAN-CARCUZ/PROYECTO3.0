const habitacionModel = require('../models/habitacionModel');

// Crear una nueva habitación
async function createHabitacion(req, res) {
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    try {
        const result = await habitacionModel.createHabitacion(nombre, descripcion, precio, imagen);
        res.status(201).json({ message: 'Habitación creada exitosamente', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Obtener todas las habitaciones
async function getHabitaciones(req, res) {
    try {
        const habitaciones = await habitacionModel.getHabitaciones();
        res.json(habitaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Actualizar una habitación
async function updateHabitacion(req, res) {
    const { id } = req.params;
    const { nombre, descripcion, precio, imagen } = req.body;
    if (!nombre || !precio) {
        return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }
    try {
        const result = await habitacionModel.updateHabitacion(id, nombre, descripcion, precio, imagen);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }
        res.status(200).json({ message: 'Habitación actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Eliminar una habitación
async function deleteHabitacion(req, res) {
    const { id } = req.params;
    try {
        const result = await habitacionModel.deleteHabitacion(id);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }
        res.status(200).json({ message: 'Habitación eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Obtener una habitación por ID
async function getHabitacionById(req, res) {
    const { id } = req.params;
    try {
        const habitacion = await habitacionModel.getHabitacionById(id);
        if (!habitacion) {
            return res.status(404).json({ error: 'Habitación no encontrada' });
        }
        res.json(habitacion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Obtener las habitaciones más reservadas
async function getHabitacionesMasReservadas(req, res) {
    try {
        const habitaciones = await habitacionModel.getHabitacionesMasReservadas();
        const labels = habitaciones.map(row => row.nombre);
        const values = habitaciones.map(row => row.reservas);
        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las habitaciones más reservadas' });
    }
}

module.exports = { 
    createHabitacion, 
    getHabitaciones, 
    updateHabitacion, 
    deleteHabitacion, 
    getHabitacionById,
    getHabitacionesMasReservadas
};

// habitacionModel.js
const pool = require('../dbConfig'); // Importa el pool desde dbConfig.js

// Crear una nueva habitación
async function createHabitacion(nombre, descripcion, precio, imagen) {
    const query = `
        INSERT INTO habitaciones (nombre, descripcion, precio, imagen) 
        VALUES ($1, $2, $3, decode($4, 'base64')) RETURNING id
    `;
    const values = [nombre, descripcion, precio, imagen];
    const result = await pool.query(query, values);
    return result.rows[0];
}

// Obtener todas las habitaciones
async function getHabitaciones() {
    const query = `SELECT id, nombre, descripcion, precio, encode(imagen, 'base64') AS imagen FROM habitaciones`;
    const result = await pool.query(query);
    return result.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        precio: row.precio,
        imagen: row.imagen
    }));
}

// Actualizar una habitación
async function updateHabitacion(id, nombre, descripcion, precio, imagen) {
    const query = `
        UPDATE habitaciones 
        SET nombre = $1, descripcion = $2, precio = $3, imagen = decode($4, 'base64') 
        WHERE id = $5
    `;
    const values = [nombre, descripcion, precio, imagen, id];
    const result = await pool.query(query, values);
    return result;
}

// Eliminar una habitación
async function deleteHabitacion(id) {
    const query = `DELETE FROM habitaciones WHERE id = $1`;
    const values = [id];
    const result = await pool.query(query, values);
    return result;
}

// Obtener una habitación por ID
async function getHabitacionById(id) {
    const query = `SELECT id, nombre, descripcion, precio, encode(imagen, 'base64') AS imagen FROM habitaciones WHERE id = $1`;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

// Obtener las habitaciones más reservadas
async function getHabitacionesMasReservadas() {
    const query = `
        SELECT H.nombre, COUNT(R.id_habitacion) AS reservas
        FROM habitaciones H
        JOIN reservaciones R ON H.id = R.id_habitacion
        GROUP BY H.nombre
        ORDER BY reservas DESC
    `;
    const result = await pool.query(query);
    return result.rows;
}

module.exports = { 
    createHabitacion, 
    getHabitaciones, 
    updateHabitacion, 
    deleteHabitacion, 
    getHabitacionById, 
    getHabitacionesMasReservadas 
};

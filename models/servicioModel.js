// servicioModel.js
const pool = require('../dbConfig'); // Importa el pool desde dbConfig.js

// Crear un nuevo servicio
async function createServicio(nombre, descripcion, costo, imagen) {
    const query = `
        INSERT INTO servicios (nombre, descripcion, costo, imagen) 
        VALUES ($1, $2, $3, decode($4, 'base64')) RETURNING id
    `;
    const values = [nombre, descripcion, costo, imagen];
    const result = await pool.query(query, values);
    return result.rows[0];
}

// Obtener todos los servicios
async function getServicios() {
    const query = `SELECT id, nombre, descripcion, costo, encode(imagen, 'base64') AS imagen FROM servicios`;
    const result = await pool.query(query);
    return result.rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        costo: row.costo,
        imagen: row.imagen
    }));
}

// Actualizar un servicio
async function updateServicio(id, nombre, descripcion, costo, imagen) {
    const query = `
        UPDATE servicios 
        SET nombre = $1, descripcion = $2, costo = $3, imagen = decode($4, 'base64') 
        WHERE id = $5
    `;
    const values = [nombre, descripcion, costo, imagen, id];
    const result = await pool.query(query, values);
    return result;
}

// Eliminar un servicio
async function deleteServicio(id) {
    const query = `DELETE FROM servicios WHERE id = $1`;
    const values = [id];
    const result = await pool.query(query, values);
    return result;
}

// Buscar un servicio por ID
async function getServicioById(id) {
    const query = `SELECT id, nombre, descripcion, costo, encode(imagen, 'base64') AS imagen FROM servicios WHERE id = $1`;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
}

// Obtener los servicios más utilizados
async function getServiciosMasUtilizados() {
    const query = `
        SELECT S.nombre, COUNT(RS.id_reservacion) AS uso
        FROM servicios S
        JOIN reservaciones_servicios RS ON S.id = RS.id_servicio
        GROUP BY S.nombre
        ORDER BY uso DESC
    `;
    const result = await pool.query(query);
    return result.rows;
}

module.exports = { 
    createServicio, 
    getServicios, 
    updateServicio, 
    deleteServicio, 
    getServicioById, 
    getServiciosMasUtilizados 
};

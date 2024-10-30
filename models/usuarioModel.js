const bcrypt = require('bcrypt');
const pool = require('../dbConfig'); // Importa el pool desde dbConfig.js

// Obtener información del usuario basado en el ID
async function getUserById(id) {
    const query = `SELECT id, nombre, email FROM usuarios WHERE id = $1`;
    const values = [id];

    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
            id: user.id,
            nombre: user.nombre,
            correo: user.email,
        };
    } else {
        return null; // Usuario no encontrado
    }
}

// Crear un nuevo usuario
async function createUsuario(nombre, apellido, email, password, pais) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const query = `
        INSERT INTO usuarios (nombre, apellido, email, password, rol, pais) 
        VALUES ($1, $2, $3, $4, 'usuario', $5) RETURNING id
    `;
    const values = [nombre, apellido, email, hashedPassword, pais];

    const result = await pool.query(query, values);
    return result.rows[0]; // Retorna el ID del nuevo usuario
}

// Resto de las funciones
// ...

module.exports = { getUserById, createUsuario, findByEmail, countUsuarios, getUsuariosPorPais };


async function findByEmail(email) {
    const query = `SELECT id, nombre, apellido, email, password, rol FROM usuarios WHERE email = $1`;
    const values = [email];

    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
        const user = result.rows[0];
        return {
            id: user.id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            password: user.password,
            rol: user.rol,
        };
    } else {
        return null; // Usuario no encontrado
    }
}

async function countUsuarios() {
    const query = `SELECT COUNT(*) AS cantidad FROM usuarios`;
    const result = await pool.query(query);
    return result.rows[0].cantidad;
}

async function getUsuariosPorPais() {
    const query = `
        SELECT pais, COUNT(*) AS cantidad
        FROM usuarios
        GROUP BY pais
        ORDER BY cantidad DESC
    `;
    const result = await pool.query(query);
    return result.rows; // Devuelve los países con la cantidad de usuarios
}

module.exports = { getUserById, createUsuario, findByEmail, countUsuarios, getUsuariosPorPais };

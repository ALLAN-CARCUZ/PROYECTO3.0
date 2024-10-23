const usuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


async function getUserById(id) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT ID, NOMBRE, EMAIL FROM USUARIOS WHERE ID = :id`,
            { id }
        );
        
        if (result.rows.length > 0) {
            const row = result.rows[0];
            return {
                id: row[0],
                nombre: row[1],
                correo: row[2]
            };
        } else {
            return null;  // Si no se encuentra el usuario
        }
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}



// Crear un nuevo usuario
async function createUsuario(req, res) {
    const { nombre, apellido, email, password, pais } = req.body;
    if (!nombre || !apellido || !email || !password || !pais) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    try {
        const result = await usuarioModel.createUsuario(nombre, apellido, email, password, pais);
        res.status(201).json({ message: 'Usuario registrado exitosamente', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


// Inicio de sesión
async function loginUsuario(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }
    
    try {
        const user = await usuarioModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user.id, rol: user.rol, nombre: user.nombre }, process.env.JWT_SECRET, { expiresIn: '1h' });


        res.json({ message: 'Inicio de sesión exitoso', token, username: user.nombre });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const { countries } = require('countries-list');

// Función para obtener la lista de países
async function getCountries(req, res) {
    try {
        const countryList = Object.values(countries).map(country => ({
            name: country.name,
            code: country.alpha2
        }));
        res.json(countryList);  // Envía la lista de países como JSON
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la lista de países' });
    }
}

module.exports = { getUserById, createUsuario, loginUsuario, getCountries };


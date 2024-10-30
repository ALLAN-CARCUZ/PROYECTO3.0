const usuarioModel = require('../models/usuarioModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { countries } = require('countries-list');

// Crear un nuevo usuario
async function createUsuario(req, res) {
    const { nombre, apellido, email, password, pais } = req.body;

    if (!nombre || !apellido || !email || !password || !pais) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    try {
        console.log("Datos de entrada:", { nombre, apellido, email, password, pais });
        const result = await usuarioModel.createUsuario(nombre, apellido, email, password, pais);
        res.status(201).json({ message: 'Usuario registrado exitosamente', result });
    } catch (error) {
        console.error('Error al crear el usuario:', error); // Verifica el mensaje exacto del error aquí
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

// Función para obtener la lista de países
async function getCountries(req, res) {
    try {
        const countryList = Object.values(countries).map(country => ({
            name: country.name,
            code: country.alpha2
        }));
        res.json(countryList);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la lista de países' });
    }
}

// Contar usuarios
async function countUsuarios(req, res) {
    try {
        const cantidad = await usuarioModel.countUsuarios();
        res.json({ cantidad });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la cantidad de usuarios' });
    }
}

// Obtener cantidad de usuarios por país
async function getUsuariosPorPais(req, res) {
    try {
        const usuarios = await usuarioModel.getUsuariosPorPais();
        const labels = [];
        const values = [];

        usuarios.forEach(row => {
            labels.push(row.pais); // Nombre del país
            values.push(row.cantidad); // Cantidad de usuarios
        });

        res.json({ labels, values });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la cantidad de usuarios por país' });
    }
}

module.exports = { createUsuario, loginUsuario, getCountries, countUsuarios, getUsuariosPorPais };

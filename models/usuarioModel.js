const bcrypt = require('bcrypt');
const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION
};

// Obtener información del usuario basado en el ID
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
async function createUsuario(nombre, apellido, email, password, pais) {
    let connection;
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        connection = await oracledb.getConnection(dbConfig);
        const rol = 'usuario';
        
        console.log('País que se va a insertar en la base de datos:', pais);  // Verificar que el país llega correctamente aquí

        const result = await connection.execute(
            `INSERT INTO usuarios (id, nombre, apellido, email, password, rol, pais) 
             VALUES (usuarios_seq.NEXTVAL, :nombre, :apellido, :email, :password, :rol, :pais)`,
            { nombre, apellido, email, password: hashedPassword, rol, pais },
            { autoCommit: true }
        );
        return result;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}



// Función para buscar un usuario por correo electrónico
async function findByEmail(email) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT id, nombre, apellido, email, password, rol FROM usuarios WHERE email = :email`,
            [email]
        );

        console.log('Resultado de la consulta:', result.rows);

        if (result.rows.length > 0) {
            const user = result.rows[0];
            return {
                id: user[0],
                nombre: user[1],
                apellido: user[2],
                email: user[3],
                password: user[4],
                rol: user[5]
            };
        } else {
            return null; // No se encontró ningún usuario
        }
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

module.exports = { getUserById, createUsuario, findByEmail };


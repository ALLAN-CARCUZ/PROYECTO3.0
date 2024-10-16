const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION
};

// Crear una nueva habitación
async function createHabitacion(nombre, descripcion, precio, imagen) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `INSERT INTO habitaciones (id, nombre, descripcion, precio, imagen) 
             VALUES (habitaciones_seq.NEXTVAL, :nombre, :descripcion, :precio, :imagen)`,
            { 
                nombre, 
                descripcion, 
                precio, 
                imagen: Buffer.from(imagen, 'base64')  // Convertir imagen base64 a Blob
            },  
            { autoCommit: true }
        );
        return result;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}


async function getHabitaciones() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT id, nombre, descripcion, precio, imagen FROM habitaciones`);

        // Usar map para recorrer las filas
        return await Promise.all(result.rows.map(async row => {
            let imagenBase64 = '';
            if (row[4]) { // row[4] es el BLOB de la imagen
                const buffer = await row[4].getData(); // Obtener los datos del BLOB
                imagenBase64 = buffer.toString('base64'); // Convertir buffer a base64
            }
            return {
                id: row[0],
                nombre: row[1],
                descripcion: row[2],
                precio: row[3],
                imagen: imagenBase64 // Devolver la imagen como cadena base64
            };
        }));
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}



// Actualizar una habitación
async function updateHabitacion(id, nombre, descripcion, precio, imagen) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `UPDATE habitaciones SET nombre = :nombre, descripcion = :descripcion, precio = :precio, imagen = :imagen 
             WHERE id = :id`,
            { nombre, descripcion, precio, imagen: Buffer.from(imagen, 'base64'), id },
            { autoCommit: true }
        );
        return result;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Eliminar una habitación
async function deleteHabitacion(id) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `DELETE FROM habitaciones WHERE id = :id`,
            { id },
            { autoCommit: true }
        );
        return result;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

module.exports = { createHabitacion, getHabitaciones, updateHabitacion, deleteHabitacion };

const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION
};

// Crear una nueva reservación
async function createReservacion(id_usuario, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Primero insertamos la reservación
        const result = await connection.execute(
            `INSERT INTO RESERVACIONES (ID_RESERVACION, ID_USUARIO, ID_HABITACION, ID_PAQUETE, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA, FECHA_RESERVACION) 
             VALUES (reservaciones_seq.NEXTVAL, :id_usuario, :id_habitacion, :id_paquete, :costo_total, :metodo_pago, TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'), TO_DATE(:fecha_salida, 'YYYY-MM-DD'), SYSDATE) 
             RETURNING ID_RESERVACION INTO :id_reservacion`,
            {
                id_usuario,
                id_habitacion,
                id_paquete,
                costo_total,
                metodo_pago,
                fecha_ingreso,
                fecha_salida,
                id_reservacion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            }
        );

        const id_reservacion = result.outBinds.id_reservacion[0]; // Obtener el ID de la reservación generada

        // Luego insertamos los servicios asociados a la reservación
        for (const id_servicio of servicios) {
            await connection.execute(
                `INSERT INTO RESERVACIONES_SERVICIOS (ID_RESERVACION, ID_SERVICIO) 
                 VALUES (:id_reservacion, :id_servicio)`,
                { id_reservacion, id_servicio }
            );
        }

        // Confirmar la transacción
        await connection.commit();

        return { success: true, message: 'Reservación creada exitosamente', id_reservacion };

    } catch (err) {
        console.error('Error al crear la reservación:', err);
        if (connection) {
            await connection.rollback();  // Revertir en caso de error
        }
        return { success: false, message: 'Error al crear la reservación', error: err };
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Obtener todas las reservaciones
async function getReservaciones() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(`SELECT ID_RESERVACION, ID_USUARIO, ID_HABITACION, ID_PAQUETE, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA FROM RESERVACIONES`);

        return result.rows.map(row => ({
            id_reservacion: row[0],
            id_usuario: row[1],
            id_habitacion: row[2],
            id_paquete: row[3],
            costo_total: row[4],
            metodo_pago: row[5],
            fecha_ingreso: row[6],
            fecha_salida: row[7]
        }));
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Actualizar una reservación
async function updateReservacion(id_reservacion, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `UPDATE RESERVACIONES SET ID_HABITACION = :id_habitacion, ID_PAQUETE = :id_paquete, COSTO_TOTAL = :costo_total, METODO_PAGO = :metodo_pago, 
             FECHA_INGRESO = TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'), FECHA_SALIDA = TO_DATE(:fecha_salida, 'YYYY-MM-DD') WHERE ID_RESERVACION = :id_reservacion`,
            { id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, id_reservacion },
            { autoCommit: true }
        );
        return result;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Eliminar una reservación
async function deleteReservacion(id_reservacion) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `DELETE FROM RESERVACIONES WHERE ID_RESERVACION = :id_reservacion`,
            { id_reservacion },
            { autoCommit: true }
        );
        return result;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Función para obtener las reservaciones de un usuario
async function getReservacionesByUsuario(id_usuario) {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Consulta para obtener las reservaciones y sus servicios
        const result = await connection.execute(
            `SELECT r.ID_RESERVACION, h.NOMBRE AS NOMBRE_HABITACION, r.FECHA_INGRESO, r.FECHA_SALIDA, r.COSTO_TOTAL, s.NOMBRE AS NOMBRE_SERVICIO
             FROM RESERVACIONES r
             JOIN HABITACIONES h ON r.ID_HABITACION = h.ID
             LEFT JOIN RESERVACIONES_SERVICIOS rs ON r.ID_RESERVACION = rs.ID_RESERVACION
             LEFT JOIN SERVICIOS s ON rs.ID_SERVICIO = s.ID
             WHERE r.ID_USUARIO = :id_usuario
             ORDER BY r.FECHA_INGRESO DESC`,
            [id_usuario]
        );

        const reservaciones = [];

        // Procesar los resultados para estructurarlos correctamente
        result.rows.forEach(row => {
            const [id_reservacion, nombre_habitacion, fecha_ingreso, fecha_salida, costo_total, nombre_servicio] = row;

            // Buscar si la reservación ya está en el array
            let reservacion = reservaciones.find(r => r.id_reservacion === id_reservacion);

            if (!reservacion) {
                // Si la reservación no está, agregarla al array
                reservacion = {
                    id_reservacion,
                    nombre_habitacion,
                    fecha_ingreso,
                    fecha_salida,
                    costo_total,
                    servicios: [] // Inicializar un array de servicios
                };
                reservaciones.push(reservacion);
            }

            // Si hay un servicio asociado, agregarlo
            if (nombre_servicio) {
                reservacion.servicios.push(nombre_servicio);
            }
        });

        return reservaciones;

    } catch (error) {
        console.error('Error al obtener las reservaciones del usuario:', error);
        throw new Error('Error al obtener las reservaciones del usuario');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

module.exports = { 
    createReservacion, 
    getReservaciones, 
    updateReservacion, 
    deleteReservacion,
    getReservacionesByUsuario  // Exportar la nueva función
};

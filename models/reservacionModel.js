const oracledb = require('oracledb');
const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION
};

// Modificación en la función para crear una nueva reservación
async function createReservacion(id_usuario, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        let query, binds;

        if (id_paquete) {
            // Si se selecciona un paquete, no necesitamos id_habitacion ni servicios
            query = `
                INSERT INTO RESERVACIONES (ID_RESERVACION, ID_USUARIO, ID_PAQUETE, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA, FECHA_RESERVACION) 
                VALUES (reservaciones_seq.NEXTVAL, :id_usuario, :id_paquete, :costo_total, :metodo_pago, TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'), TO_DATE(:fecha_salida, 'YYYY-MM-DD'), SYSDATE)
                RETURNING ID_RESERVACION INTO :id_reservacion
            `;
            binds = {
                id_usuario,
                id_paquete,
                costo_total,
                metodo_pago,
                fecha_ingreso,
                fecha_salida,
                id_reservacion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            };
        } else {
            // Si se elige habitación y servicios
            query = `
                INSERT INTO RESERVACIONES (ID_RESERVACION, ID_USUARIO, ID_HABITACION, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA, FECHA_RESERVACION) 
                VALUES (reservaciones_seq.NEXTVAL, :id_usuario, :id_habitacion, :costo_total, :metodo_pago, TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'), TO_DATE(:fecha_salida, 'YYYY-MM-DD'), SYSDATE)
                RETURNING ID_RESERVACION INTO :id_reservacion
            `;
            binds = {
                id_usuario,
                id_habitacion,
                costo_total,
                metodo_pago,
                fecha_ingreso,
                fecha_salida,
                id_reservacion: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
            };
        }

        const result = await connection.execute(query, binds);

        const id_reservacion = result.outBinds.id_reservacion[0]; // Obtener el ID de la reservación generada

        // Solo insertar servicios si no se seleccionó un paquete
        if (!id_paquete && servicios && servicios.length > 0) {
            for (const id_servicio of servicios) {
                await connection.execute(
                    `INSERT INTO RESERVACIONES_SERVICIOS (ID_RESERVACION, ID_SERVICIO) 
                     VALUES (:id_reservacion, :id_servicio)`,
                    { id_reservacion, id_servicio }
                );
            }
        }

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



async function getReservaciones() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        
        // Consulta para obtener reservaciones tanto de habitaciones como de paquetes
        const result = await connection.execute(
            `SELECT r.ID_RESERVACION, h.NOMBRE AS NOMBRE_HABITACION, p.NOMBRE AS NOMBRE_PAQUETE, 
                    r.FECHA_INGRESO, r.FECHA_SALIDA, r.COSTO_TOTAL, s.NOMBRE AS NOMBRE_SERVICIO, 
                    u.NOMBRE AS NOMBRE_USUARIO
             FROM RESERVACIONES r
             LEFT JOIN HABITACIONES h ON r.ID_HABITACION = h.ID
             LEFT JOIN PAQUETES p ON r.ID_PAQUETE = p.ID
             LEFT JOIN RESERVACIONES_SERVICIOS rs ON r.ID_RESERVACION = rs.ID_RESERVACION
             LEFT JOIN SERVICIOS s ON rs.ID_SERVICIO = s.ID
             JOIN USUARIOS u ON r.ID_USUARIO = u.ID  -- Unir con la tabla de usuarios
             ORDER BY r.FECHA_INGRESO DESC`
        );

        const reservaciones = [];

        result.rows.forEach(row => {
            const [id_reservacion, nombre_habitacion, nombre_paquete, fecha_ingreso, fecha_salida, costo_total, nombre_servicio, nombre_usuario] = row;

            // Buscar si la reservación ya está en el array
            let reservacion = reservaciones.find(r => r.id_reservacion === id_reservacion);

            if (!reservacion) {
                // Si la reservación no está, agregarla al array
                reservacion = {
                    id_reservacion,
                    nombre_habitacion,
                    nombre_paquete,  // Ahora también mostramos el nombre del paquete
                    fecha_ingreso,
                    fecha_salida,
                    costo_total,
                    nombre_usuario,  // Agregar el nombre del usuario
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

    } finally {
        if (connection) {
            await connection.close();
        }
    }
}





async function updateReservacion(id_reservacion, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Actualizar la reservación principal
        const result = await connection.execute(
            `UPDATE RESERVACIONES SET ID_HABITACION = :id_habitacion, ID_PAQUETE = :id_paquete, COSTO_TOTAL = :costo_total, METODO_PAGO = :metodo_pago, 
             FECHA_INGRESO = TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'), FECHA_SALIDA = TO_DATE(:fecha_salida, 'YYYY-MM-DD') WHERE ID_RESERVACION = :id_reservacion`,
            { id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, id_reservacion },
            { autoCommit: false }
        );

        // Eliminar las relaciones anteriores de servicios
        await deleteReservacionServicios(id_reservacion);

        // Insertar las nuevas relaciones de servicios
        for (const id_servicio of servicios) {
            await connection.execute(
                `INSERT INTO RESERVACIONES_SERVICIOS (ID_RESERVACION, ID_SERVICIO) VALUES (:id_reservacion, :id_servicio)`,
                { id_reservacion, id_servicio }
            );
        }

        // Confirmar la transacción
        await connection.commit();

        return result;
    } catch (error) {
        console.error('Error al actualizar la reservación:', error);
        console.log('ID de la reservación:', id_reservacion); // Verificar si el id_reservacion está llegando correctamente

        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
    
}





// Función para eliminar las relaciones de servicios en la tabla intermedia
async function deleteReservacionServicios(id_reservacion) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const query = `DELETE FROM RESERVACIONES_SERVICIOS WHERE ID_RESERVACION = :id_reservacion`;
        const result = await connection.execute(query, { id_reservacion }, { autoCommit: true });
        console.log("Relaciones eliminadas en RESERVACIONES_SERVICIOS:", result);
        return result;
    } catch (error) {
        console.error("Error eliminando relaciones de servicios:", error);
        throw new Error("Error al eliminar relaciones de servicios: " + error.message);
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Función para eliminar una reservación
async function deleteReservacion(id_reservacion) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `DELETE FROM RESERVACIONES WHERE ID_RESERVACION = :id_reservacion`,
            { id_reservacion },
            { autoCommit: true }
        );
        console.log("Reservación eliminada en RESERVACIONES:", result);
        return result;
    } catch (error) {
        console.error("Error eliminando la reservación:", error);
        throw new Error("Error al eliminar la reservación: " + error.message);
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
        
        // Modificar la consulta para incluir paquetes y habitaciones
        const result = await connection.execute(
            `SELECT r.ID_RESERVACION, h.NOMBRE AS NOMBRE_HABITACION, p.NOMBRE AS NOMBRE_PAQUETE, 
                    r.FECHA_INGRESO, r.FECHA_SALIDA, r.COSTO_TOTAL, s.NOMBRE AS NOMBRE_SERVICIO
             FROM RESERVACIONES r
             LEFT JOIN HABITACIONES h ON r.ID_HABITACION = h.ID
             LEFT JOIN PAQUETES p ON r.ID_PAQUETE = p.ID
             LEFT JOIN RESERVACIONES_SERVICIOS rs ON r.ID_RESERVACION = rs.ID_RESERVACION
             LEFT JOIN SERVICIOS s ON rs.ID_SERVICIO = s.ID
             WHERE r.ID_USUARIO = :id_usuario
             ORDER BY r.FECHA_INGRESO DESC`,
            [id_usuario]
        );

        const reservaciones = [];

        result.rows.forEach(row => {
            const [id_reservacion, nombre_habitacion, nombre_paquete, fecha_ingreso, fecha_salida, costo_total, nombre_servicio] = row;

            let reservacion = reservaciones.find(r => r.id_reservacion === id_reservacion);

            if (!reservacion) {
                reservacion = {
                    id_reservacion,
                    nombre_habitacion,
                    nombre_paquete,  // Ahora también mostramos el nombre del paquete
                    fecha_ingreso,
                    fecha_salida,
                    costo_total,
                    servicios: []
                };
                reservaciones.push(reservacion);
            }

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


// Obtener una reservación por ID
async function findByPk(id_reservacion) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT ID_RESERVACION, ID_USUARIO, ID_HABITACION, ID_PAQUETE, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA
             FROM RESERVACIONES WHERE ID_RESERVACION = :id_reservacion`,
            { id_reservacion }
        );

        if (result.rows.length === 0) {
            return null; // Si no se encuentra la reservación
        }

        const row = result.rows[0];
        return {
            id_reservacion: row[0],
            id_usuario: row[1],
            id_habitacion: row[2],
            id_paquete: row[3],
            costo_total: row[4],
            metodo_pago: row[5],
            fecha_ingreso: row[6],
            fecha_salida: row[7]
        };
    } catch (error) {
        console.error('Error al obtener la reservación por ID:', error);
        throw new Error('Error al obtener la reservación');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function checkDisponibilidadHabitacion(id_habitacion, fecha_ingreso, fecha_salida) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const query = `
            SELECT * FROM RESERVACIONES
            WHERE ID_HABITACION = :id_habitacion
            AND (
                (FECHA_INGRESO <= TO_DATE(:fecha_salida, 'YYYY-MM-DD') AND FECHA_SALIDA >= TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'))
            )
        `;
        const result = await connection.execute(query, { id_habitacion, fecha_ingreso, fecha_salida });
        return result.rows;
    } catch (error) {
        console.error('Error al verificar la disponibilidad de la habitación:', error);
        throw new Error('Error al verificar la disponibilidad de la habitación');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

// Obtener fechas reservadas para una habitación
async function getFechasReservadasByHabitacion(id_habitacion) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        // Consultar las fechas de ingreso y salida de las reservaciones de esa habitación
        const result = await connection.execute(
            `SELECT FECHA_INGRESO, FECHA_SALIDA 
             FROM RESERVACIONES 
             WHERE ID_HABITACION = :id_habitacion 
             AND FECHA_SALIDA >= SYSDATE`,  // Solo obtenemos las fechas futuras
            { id_habitacion }
        );

        // Mapear los resultados para devolver un array de objetos con las fechas
        return result.rows.map(row => ({
            fecha_ingreso: row[0],
            fecha_salida: row[1]
        }));
    } catch (error) {
        console.error('Error al obtener las fechas reservadas de la habitación:', error);
        throw new Error('Error al obtener las fechas reservadas');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}


async function checkDisponibilidadPaquete(id_paquete, fecha_ingreso, fecha_salida) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        const query = `
            SELECT * FROM RESERVACIONES
            WHERE ID_PAQUETE = :id_paquete
            AND (
                (FECHA_INGRESO <= TO_DATE(:fecha_salida, 'YYYY-MM-DD') AND FECHA_SALIDA >= TO_DATE(:fecha_ingreso, 'YYYY-MM-DD'))
            )
        `;
        const result = await connection.execute(query, { id_paquete, fecha_ingreso, fecha_salida });
        return result.rows;
    } catch (error) {
        console.error('Error al verificar la disponibilidad del paquete:', error);
        throw new Error('Error al verificar la disponibilidad del paquete');
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

async function getFechasReservadasByPaquete(id_paquete) {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `SELECT FECHA_INGRESO, FECHA_SALIDA 
             FROM RESERVACIONES 
             WHERE ID_PAQUETE = :id_paquete
             AND FECHA_SALIDA >= SYSDATE`,  // Solo obtenemos las fechas futuras
            { id_paquete }
        );

        return result.rows.map(row => ({
            fecha_ingreso: row[0],
            fecha_salida: row[1]
        }));
    } catch (error) {
        console.error('Error al obtener las fechas reservadas del paquete:', error);
        throw new Error('Error al obtener las fechas reservadas');
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
    getReservacionesByUsuario,
    findByPk,
    checkDisponibilidadHabitacion,
    getFechasReservadasByHabitacion, // Exportamos la nueva función
    deleteReservacionServicios,
    checkDisponibilidadPaquete,
    getFechasReservadasByPaquete
};

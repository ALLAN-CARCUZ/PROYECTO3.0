const pool = require('../dbConfig'); // Importa el pool desde dbConfig.js

// Función para crear una nueva reservación
async function createReservacion(id_usuario, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        let query, values;
        let id_reservacion;

        if (id_paquete) {
            // Si se selecciona un paquete, no necesitamos id_habitacion ni servicios
            query = `
                INSERT INTO RESERVACIONES (ID_RESERVACION, ID_USUARIO, ID_PAQUETE, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA, FECHA_RESERVACION) 
                VALUES (nextval('reservaciones_seq'), $1, $2, $3, $4, $5::date, $6::date, NOW())
                RETURNING ID_RESERVACION
            `;
            values = [id_usuario, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida];
        } else {
            // Si se elige habitación y servicios
            query = `
                INSERT INTO RESERVACIONES (ID_RESERVACION, ID_USUARIO, ID_HABITACION, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA, FECHA_RESERVACION) 
                VALUES (nextval('reservaciones_seq'), $1, $2, $3, $4, $5::date, $6::date, NOW())
                RETURNING ID_RESERVACION
            `;
            values = [id_usuario, id_habitacion, costo_total, metodo_pago, fecha_ingreso, fecha_salida];
        }

        const result = await client.query(query, values);
        id_reservacion = result.rows[0].id_reservacion;

        // Solo insertar servicios si no se seleccionó un paquete
        if (!id_paquete && servicios && servicios.length > 0) {
            const insertServicioQuery = `INSERT INTO RESERVACIONES_SERVICIOS (ID_RESERVACION, ID_SERVICIO) VALUES ($1, $2)`;
            for (const id_servicio of servicios) {
                await client.query(insertServicioQuery, [id_reservacion, id_servicio]);
            }
        }

        await client.query('COMMIT');
        return { success: true, message: 'Reservación creada exitosamente', id_reservacion };
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error al crear la reservación:', err);
        return { success: false, message: 'Error al crear la reservación', error: err };
    } finally {
        client.release();
    }
}

// Función para obtener todas las reservaciones
async function getReservaciones() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT r.ID_RESERVACION, h.NOMBRE AS NOMBRE_HABITACION, h.IMAGEN AS IMAGEN_HABITACION, 
                   p.NOMBRE AS NOMBRE_PAQUETE, p.IMAGEN AS IMAGEN_PAQUETE, 
                   r.FECHA_INGRESO, r.FECHA_SALIDA, r.COSTO_TOTAL, 
                   s.NOMBRE AS NOMBRE_SERVICIO, u.NOMBRE AS NOMBRE_USUARIO
            FROM RESERVACIONES r
            LEFT JOIN HABITACIONES h ON r.ID_HABITACION = h.ID
            LEFT JOIN PAQUETES p ON r.ID_PAQUETE = p.ID
            LEFT JOIN RESERVACIONES_SERVICIOS rs ON r.ID_RESERVACION = rs.ID_RESERVACION
            LEFT JOIN SERVICIOS s ON rs.ID_SERVICIO = s.ID
            JOIN USUARIOS u ON r.ID_USUARIO = u.ID
            ORDER BY r.FECHA_INGRESO DESC
        `;

        const result = await client.query(query);

        const reservaciones = [];

        for (const row of result.rows) {
            const { id_reservacion, nombre_habitacion, imagen_habitacion, nombre_paquete, imagen_paquete, fecha_ingreso, fecha_salida, costo_total, nombre_servicio, nombre_usuario } = row;

            let reservacion = reservaciones.find(r => r.id_reservacion === id_reservacion);

            if (!reservacion) {
                const imagenHabitacionBase64 = imagen_habitacion ? imagen_habitacion.toString('base64') : null;
                const imagenPaqueteBase64 = imagen_paquete ? imagen_paquete.toString('base64') : null;

                reservacion = {
                    id_reservacion,
                    nombre_habitacion,
                    imagen_habitacion: imagenHabitacionBase64,
                    nombre_paquete,
                    imagen_paquete: imagenPaqueteBase64,
                    fecha_ingreso,
                    fecha_salida,
                    costo_total,
                    nombre_usuario,
                    servicios: []
                };
                reservaciones.push(reservacion);
            }

            if (nombre_servicio) {
                reservacion.servicios.push(nombre_servicio);
            }
        }

        return reservaciones;
    } catch (error) {
        console.error('Error al obtener las reservaciones:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Función para actualizar una reservación
async function updateReservacion(id_reservacion, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Actualizar la reservación principal
        const updateQuery = `
            UPDATE RESERVACIONES 
            SET ID_HABITACION = $1, ID_PAQUETE = $2, COSTO_TOTAL = $3, METODO_PAGO = $4, 
                FECHA_INGRESO = $5::date, FECHA_SALIDA = $6::date 
            WHERE ID_RESERVACION = $7
        `;
        const updateValues = [id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, id_reservacion];
        await client.query(updateQuery, updateValues);

        // Eliminar las relaciones anteriores de servicios
        await deleteReservacionServicios(id_reservacion, client);

        // Insertar las nuevas relaciones de servicios
        if (servicios && servicios.length > 0) {
            const insertServicioQuery = `INSERT INTO RESERVACIONES_SERVICIOS (ID_RESERVACION, ID_SERVICIO) VALUES ($1, $2)`;
            for (const id_servicio of servicios) {
                await client.query(insertServicioQuery, [id_reservacion, id_servicio]);
            }
        }

        await client.query('COMMIT');

        return { success: true, message: 'Reservación actualizada exitosamente' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar la reservación:', error);
        console.log('ID de la reservación:', id_reservacion);
        return { success: false, message: 'Error al actualizar la reservación', error: error };
    } finally {
        client.release();
    }
}

// Función para eliminar las relaciones de servicios en la tabla intermedia
async function deleteReservacionServicios(id_reservacion, client = null) {
    const localClient = client ? null : await pool.connect();
    try {
        if (!client) await localClient.query('BEGIN');

        const query = `DELETE FROM RESERVACIONES_SERVICIOS WHERE ID_RESERVACION = $1`;
        await (client || localClient).query(query, [id_reservacion]);

        if (!client) await localClient.query('COMMIT');
    } catch (error) {
        if (!client) await localClient.query('ROLLBACK');
        console.error("Error eliminando relaciones de servicios:", error);
        throw new Error("Error al eliminar relaciones de servicios: " + error.message);
    } finally {
        if (!client && localClient) {
            localClient.release();
        }
    }
}

// Función para eliminar una reservación
async function deleteReservacion(id_reservacion) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const deleteQuery = `DELETE FROM RESERVACIONES WHERE ID_RESERVACION = $1`;
        await client.query(deleteQuery, [id_reservacion]);

        await client.query('COMMIT');
        return { success: true, message: 'Reservación eliminada exitosamente' };
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error eliminando la reservación:", error);
        return { success: false, message: 'Error al eliminar la reservación', error: error };
    } finally {
        client.release();
    }
}

// Función para obtener las reservaciones de un usuario
async function getReservacionesByUsuario(id_usuario) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT r.ID_RESERVACION, h.NOMBRE AS NOMBRE_HABITACION, p.NOMBRE AS NOMBRE_PAQUETE, 
                   r.FECHA_INGRESO, r.FECHA_SALIDA, r.COSTO_TOTAL, s.NOMBRE AS NOMBRE_SERVICIO, 
                   u.NOMBRE AS NOMBRE_USUARIO
            FROM RESERVACIONES r
            LEFT JOIN HABITACIONES h ON r.ID_HABITACION = h.ID
            LEFT JOIN PAQUETES p ON r.ID_PAQUETE = p.ID
            LEFT JOIN RESERVACIONES_SERVICIOS rs ON r.ID_RESERVACION = rs.ID_RESERVACION
            LEFT JOIN SERVICIOS s ON rs.ID_SERVICIO = s.ID
            JOIN USUARIOS u ON r.ID_USUARIO = u.ID
            WHERE r.ID_USUARIO = $1
            ORDER BY r.FECHA_INGRESO DESC
        `;

        const result = await client.query(query, [id_usuario]);

        const reservaciones = [];

        for (const row of result.rows) {
            const { id_reservacion, nombre_habitacion, nombre_paquete, fecha_ingreso, fecha_salida, costo_total, nombre_servicio, nombre_usuario } = row;

            let reservacion = reservaciones.find(r => r.id_reservacion === id_reservacion);

            if (!reservacion) {
                reservacion = {
                    id_reservacion,
                    nombre_habitacion,
                    nombre_paquete,
                    fecha_ingreso,
                    fecha_salida,
                    costo_total,
                    nombre_usuario,
                    servicios: []
                };
                reservaciones.push(reservacion);
            }

            if (nombre_servicio) {
                reservacion.servicios.push(nombre_servicio);
            }
        }

        return reservaciones;
    } catch (error) {
        console.error('Error al obtener las reservaciones del usuario:', error);
        throw new Error('Error al obtener las reservaciones del usuario');
    } finally {
        client.release();
    }
}

// Función para obtener una reservación por ID
async function findByPk(id_reservacion) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT ID_RESERVACION, ID_USUARIO, ID_HABITACION, ID_PAQUETE, COSTO_TOTAL, METODO_PAGO, FECHA_INGRESO, FECHA_SALIDA
            FROM RESERVACIONES 
            WHERE ID_RESERVACION = $1
        `;
        const result = await client.query(query, [id_reservacion]);

        if (result.rows.length === 0) {
            return null; // Si no se encuentra la reservación
        }

        const row = result.rows[0];
        return {
            id_reservacion: row.id_reservacion,
            id_usuario: row.id_usuario,
            id_habitacion: row.id_habitacion,
            id_paquete: row.id_paquete,
            costo_total: row.costo_total,
            metodo_pago: row.metodo_pago,
            fecha_ingreso: row.fecha_ingreso,
            fecha_salida: row.fecha_salida
        };
    } catch (error) {
        console.error('Error al obtener la reservación por ID:', error);
        throw new Error('Error al obtener la reservación');
    } finally {
        client.release();
    }
}

// Función para verificar la disponibilidad de una habitación
async function checkDisponibilidadHabitacion(id_habitacion, fecha_ingreso, fecha_salida) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT * FROM RESERVACIONES
            WHERE ID_HABITACION = $1
            AND (
                (FECHA_INGRESO <= $3::date AND FECHA_SALIDA >= $2::date)
            )
        `;
        const result = await client.query(query, [id_habitacion, fecha_ingreso, fecha_salida]);
        return result.rows;
    } catch (error) {
        console.error('Error al verificar la disponibilidad de la habitación:', error);
        throw new Error('Error al verificar la disponibilidad de la habitación');
    } finally {
        client.release();
    }
}

// Función para obtener fechas reservadas para una habitación
async function getFechasReservadasByHabitacion(id_habitacion) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT FECHA_INGRESO, FECHA_SALIDA 
            FROM RESERVACIONES 
            WHERE ID_HABITACION = $1 
            AND FECHA_SALIDA >= NOW()
        `;
        const result = await client.query(query, [id_habitacion]);

        return result.rows.map(row => ({
            fecha_ingreso: row.fecha_ingreso,
            fecha_salida: row.fecha_salida
        }));
    } catch (error) {
        console.error('Error al obtener las fechas reservadas de la habitación:', error);
        throw new Error('Error al obtener las fechas reservadas');
    } finally {
        client.release();
    }
}

// Función para verificar la disponibilidad de un paquete
async function checkDisponibilidadPaquete(id_paquete, fecha_ingreso, fecha_salida) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT * FROM RESERVACIONES
            WHERE ID_PAQUETE = $1
            AND (
                (FECHA_INGRESO <= $3::date AND FECHA_SALIDA >= $2::date)
            )
        `;
        const result = await client.query(query, [id_paquete, fecha_ingreso, fecha_salida]);
        return result.rows;
    } catch (error) {
        console.error('Error al verificar la disponibilidad del paquete:', error);
        throw new Error('Error al verificar la disponibilidad del paquete');
    } finally {
        client.release();
    }
}

// Función para obtener fechas reservadas para un paquete
async function getFechasReservadasByPaquete(id_paquete) {
    const client = await pool.connect();
    try {
        const query = `
            SELECT FECHA_INGRESO, FECHA_SALIDA 
            FROM RESERVACIONES 
            WHERE ID_PAQUETE = $1
            AND FECHA_SALIDA >= NOW()
        `;
        const result = await client.query(query, [id_paquete]);

        return result.rows.map(row => ({
            fecha_ingreso: row.fecha_ingreso,
            fecha_salida: row.fecha_salida
        }));
    } catch (error) {
        console.error('Error al obtener las fechas reservadas del paquete:', error);
        throw new Error('Error al obtener las fechas reservadas');
    } finally {
        client.release();
    }
}

// Función para obtener el total de ingresos
async function getTotalIngresos() {
    const client = await pool.connect();
    try {
        const query = `SELECT SUM(COSTO_TOTAL) AS TOTAL_INGRESOS FROM RESERVACIONES`;
        const result = await client.query(query);
        return result.rows[0].total_ingresos;
    } catch (error) {
        console.error('Error al obtener el total de ingresos:', error);
        throw new Error('Error al obtener el total de ingresos');
    } finally {
        client.release();
    }
}

// Función para obtener las reservaciones por mes
async function getReservacionesPorMes() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT TO_CHAR(FECHA_RESERVACION, 'MM') AS MES, COUNT(*) AS CANTIDAD
            FROM RESERVACIONES
            WHERE TO_CHAR(FECHA_RESERVACION, 'YYYY') = '2024'
            GROUP BY TO_CHAR(FECHA_RESERVACION, 'MM')
            ORDER BY MES
        `;
        const result = await client.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error al obtener las reservaciones por mes:', error);
        throw new Error('Error al obtener las reservaciones por mes');
    } finally {
        client.release();
    }
}

// Función para calcular el promedio de días de estadía
async function getPromedioDiasReservacion() {
    const client = await pool.connect();
    try {
        const query = `
            SELECT AVG(FECHA_SALIDA - FECHA_INGRESO) AS PROMEDIO_DIAS
            FROM RESERVACIONES
        `;
        const result = await client.query(query);
        return result.rows[0].promedio_dias;
    } catch (error) {
        console.error('Error al calcular el promedio de días de estadía:', error);
        throw new Error('Error al calcular el promedio de días de estadía');
    } finally {
        client.release();
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
    getFechasReservadasByHabitacion,
    deleteReservacionServicios,
    checkDisponibilidadPaquete,
    getFechasReservadasByPaquete,
    getTotalIngresos,
    getReservacionesPorMes,
    getPromedioDiasReservacion
};


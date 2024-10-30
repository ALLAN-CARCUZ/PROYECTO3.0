// paqueteModel.js
const pool = require('../dbConfig'); // Importa el pool desde dbConfig.js

// Crear un nuevo paquete
async function createPaquete(nombre, descripcion, precio, imagen, habitacion_id, servicios, descuento) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Insertar en la tabla 'paquetes'
        const paqueteResult = await client.query(
            `INSERT INTO paquetes (nombre, descripcion, precio, imagen, habitacion_id, descuento)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [nombre, descripcion, precio, imagen ? Buffer.from(imagen, 'base64') : null, habitacion_id, descuento]
        );

        const paqueteId = paqueteResult.rows[0].id;

        // Insertar en la tabla 'paquetes_servicios'
        for (const servicioId of servicios) {
            await client.query(
                `INSERT INTO paquetes_servicios (paquete_id, servicio_id)
                 VALUES ($1, $2)`,
                [paqueteId, servicioId]
            );
        }

        await client.query('COMMIT');
        return { id: paqueteId };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Obtener todos los paquetes
async function getPaquetes() {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.habitacion_id, p.descuento,
                    h.nombre AS habitacion_nombre, h.precio AS habitacion_precio
             FROM paquetes p
             JOIN habitaciones h ON p.habitacion_id = h.id`
        );

        const paquetes = [];

        for (const row of result.rows) {
            // Obtener servicios para cada paquete
            const serviciosResult = await client.query(
                `SELECT s.id, s.nombre, s.costo
                 FROM servicios s
                 JOIN paquetes_servicios ps ON s.id = ps.servicio_id
                 WHERE ps.paquete_id = $1`,
                [row.id]
            );

            let imagenBase64 = '';
            if (row.imagen) {
                imagenBase64 = row.imagen.toString('base64');
            }

            paquetes.push({
                id: row.id,
                nombre: row.nombre,
                descripcion: row.descripcion,
                precio: parseFloat(row.precio),
                descuento: parseFloat(row.descuento),
                imagen: imagenBase64,
                habitacion_id: row.habitacion_id,
                habitacion_nombre: row.habitacion_nombre,
                habitacion_precio: parseFloat(row.habitacion_precio),
                servicios: serviciosResult.rows.map(servicio => ({
                    id: servicio.id,
                    nombre: servicio.nombre,
                    costo: parseFloat(servicio.costo)
                }))
            });
        }

        return paquetes;
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

// Actualizar un paquete
async function updatePaquete(id, nombre, descripcion, precio, imagen, habitacion_id, servicios, descuento) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Actualizar la tabla 'paquetes'
        const result = await client.query(
            `UPDATE paquetes SET nombre = $1, descripcion = $2, precio = $3, imagen = $4, habitacion_id = $5, descuento = $6
             WHERE id = $7`,
            [nombre, descripcion, precio, imagen ? Buffer.from(imagen, 'base64') : null, habitacion_id, descuento, id]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return { rowCount: 0 };
        }

        // Eliminar servicios actuales
        await client.query(
            `DELETE FROM paquetes_servicios WHERE paquete_id = $1`,
            [id]
        );

        // Insertar servicios actualizados
        for (const servicioId of servicios) {
            await client.query(
                `INSERT INTO paquetes_servicios (paquete_id, servicio_id)
                 VALUES ($1, $2)`,
                [id, servicioId]
            );
        }

        await client.query('COMMIT');
        return { rowCount: result.rowCount };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Eliminar un paquete
async function deletePaquete(id) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Eliminar de 'paquetes'
        const result = await client.query(
            `DELETE FROM paquetes WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');
        return { rowCount: result.rowCount };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Obtener un paquete por su ID
async function getPaqueteById(id) {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT p.id, p.nombre, p.descripcion, p.precio, p.imagen, p.habitacion_id, p.descuento, 
                    h.nombre AS habitacion_nombre, h.precio AS habitacion_precio
             FROM paquetes p
             JOIN habitaciones h ON p.habitacion_id = h.id
             WHERE p.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return null; // Si no se encuentra el paquete
        }

        const row = result.rows[0];
        let imagenBase64 = '';
        if (row.imagen) {
            imagenBase64 = row.imagen.toString('base64');
        }

        // Obtener servicios para el paquete
        const serviciosResult = await client.query(
            `SELECT s.id, s.nombre, s.costo
             FROM servicios s
             JOIN paquetes_servicios ps ON s.id = ps.servicio_id
             WHERE ps.paquete_id = $1`,
            [row.id]
        );

        return {
            id: row.id,
            nombre: row.nombre,
            descripcion: row.descripcion,
            precio: parseFloat(row.precio),
            descuento: parseFloat(row.descuento),
            imagen: imagenBase64,
            habitacion_id: row.habitacion_id,
            habitacion_nombre: row.habitacion_nombre,
            habitacion_precio: parseFloat(row.habitacion_precio),
            servicios: serviciosResult.rows.map(servicio => ({
                id: servicio.id,
                nombre: servicio.nombre,
                costo: parseFloat(servicio.costo)
            }))
        };
    } catch (error) {
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { 
    createPaquete, 
    getPaquetes, 
    updatePaquete, 
    deletePaquete, 
    getPaqueteById 
};

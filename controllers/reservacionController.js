const reservacionModel = require('../models/reservacionModel');
const { getUserById } = require('../models/usuarioModel');
const nodemailer = require('nodemailer');

// Configurar el transporte para enviar correos
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Puedes usar otro servicio si lo prefieres
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

async function createReservacion(req, res) {
    const { id_usuario, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios } = req.body;

    // Validar los campos requeridos
    if (!id_usuario || !id_habitacion || !costo_total || !metodo_pago || !fecha_ingreso || !fecha_salida) {
        return res.status(400).json({ error: 'Todos los campos son requeridos: id_usuario, id_habitacion, costo_total, metodo_pago, fecha_ingreso y fecha_salida' });
    }

    try {
        // Intentar crear la reservación
        const result = await reservacionModel.createReservacion(id_usuario, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios);

        // Obtener la información del usuario para el correo
        const usuario = await getUserById(id_usuario);  // Ahora usamos 'ID' en lugar de 'ID_USUARIO'

        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const correoCliente = usuario.correo;

        // Preparar el contenido del correo
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: correoCliente,
            subject: 'Confirmación de reservación - Hotel El Dodo',
            text: `Estimado/a ${usuario.nombre},\n\nSu reservación ha sido creada exitosamente. Aquí están los detalles:\n\n
            Habitación: ${id_habitacion}\n
            Fecha de entrada: ${fecha_ingreso}\n
            Fecha de salida: ${fecha_salida}\n
            Servicios adicionales: ${servicios.join(', ')}\n
            Total: Q${costo_total.toFixed(2)}\n\n
            ¡Gracias por elegir nuestro hotel!`
        };

        // Enviar el correo
        await transporter.sendMail(mailOptions);

        // Si la reservación se crea exitosamente, responder con éxito
        res.status(201).json({ message: 'Reservación creada exitosamente, y correo enviado al cliente.', id_reservacion: result.id_reservacion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Función para obtener las reservaciones del usuario autenticado
async function getReservacionesByUsuario(req, res) {
    const id_usuario = req.user.id;  // El id del usuario autenticado viene del token decodificado por el middleware

    try {
        const reservaciones = await reservacionModel.getReservacionesByUsuario(id_usuario);
        res.status(200).json(reservaciones);
    } catch (error) {
        console.error('Error al obtener las reservaciones del usuario:', error);  // <-- Agregar este log
        res.status(500).json({ error: error.message });
    }
}

// Obtener todas las reservaciones (GET)
async function getReservaciones(req, res) {
    try {
        const reservaciones = await reservacionModel.getReservaciones();
        res.json(reservaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Actualizar una reservación (PUT)
async function updateReservacion(req, res) {
    const { id } = req.params;  // Aquí estamos obteniendo el ID de los parámetros de la URL
    const { id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios } = req.body;

    console.log('ID de la reservación:', id);  // Verifica si el ID se está recibiendo correctamente
        // Agrega este log para verificar si el ID se recibe correctamente
        console.log('ID recibido en params:', req.params.id);

    if (!id || !id_habitacion || !costo_total || !metodo_pago || !fecha_ingreso || !fecha_salida) {
        return res.status(400).json({ error: 'Todos los campos son requeridos, incluyendo el ID de la reservación' });
    }

    try {
        const result = await reservacionModel.updateReservacion(id, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida, servicios);
        res.status(200).json({ message: 'Reservación actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


async function deleteReservacion(req, res) {
    const { id_reservacion } = req.params;
    console.log("ID de la reservación a eliminar:", id_reservacion);

    if (!id_reservacion) {
        return res.status(400).json({ error: 'El ID de la reservación es requerido' });
    }

    try {
        // Eliminar las relaciones de la tabla intermedia (RESERVACIONES_SERVICIOS)
        await reservacionModel.deleteReservacionServicios(id_reservacion);
        console.log("Relaciones de servicios eliminadas para la reservación:", id_reservacion);

        // Ahora eliminar la reservación en la tabla principal (RESERVACIONES)
        const result = await reservacionModel.deleteReservacion(id_reservacion);
        console.log("Resultado de la eliminación de la reservación:", result);

        if (!result || result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Reservación no encontrada' });
        }

        res.status(200).json({ message: 'Reservación y relaciones eliminadas exitosamente' });
    } catch (error) {
        console.error("Error durante la eliminación:", error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
}


const obtenerReservacionPorId = async (req, res) => {
    const { id } = req.params;
    console.log(`Buscando reservación con ID: ${id}`);
    try {
        const reservacion = await reservacionModel.findByPk(id);  // Cambiamos a `reservacionModel.findByPk`
        
        if (!reservacion) {
            return res.status(404).json({ error: 'Reservación no encontrada' });
        }
        res.json(reservacion);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la reservación' });
    }
};





module.exports = { 
    createReservacion, 
    getReservaciones, 
    updateReservacion, 
    deleteReservacion,
    getReservacionesByUsuario,
    obtenerReservacionPorId
};


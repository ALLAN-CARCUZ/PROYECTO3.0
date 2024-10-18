document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Debes iniciar sesión para ver tus reservaciones.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/reservaciones/usuario', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                 'Content-Type': 'application/json'
            }
        });

        const reservaciones = await response.json();

        if (response.ok) {
            mostrarReservaciones(reservaciones);
        } else {
            alert('Error al cargar reservaciones: ' + reservaciones.message);
        }
    } catch (error) {
        console.error('Error al obtener las reservaciones:', error);
        alert('Error al obtener las reservaciones.');
    }
});

function mostrarReservaciones(reservaciones) {
    const container = document.getElementById('reservacionesContainer');
    container.innerHTML = '';

    if (reservaciones.length === 0) {
        container.innerHTML = '<p>No tienes reservaciones aún.</p>';
        return;
    }

    reservaciones.forEach(reservacion => {
        const reservacionElement = document.createElement('div');
        reservacionElement.classList.add('reservacion-item');
        
        // Crear una lista de servicios
        let serviciosList = '';
        if (reservacion.servicios.length > 0) {
            serviciosList = reservacion.servicios.map(servicio => `<li>${servicio}</li>`).join('');
        } else {
            serviciosList = '<li>No hay servicios adicionales</li>';
        }

        reservacionElement.innerHTML = `
            <h3>Reservación ID: ${reservacion.id_reservacion}</h3>
            <p>Habitación: ${reservacion.nombre_habitacion}</p>
            <p>Fecha de Ingreso: ${new Date(reservacion.fecha_ingreso).toLocaleDateString()}</p>
            <p>Fecha de Salida: ${new Date(reservacion.fecha_salida).toLocaleDateString()}</p>
            <p>Total: Q${reservacion.costo_total.toFixed(2)}</p>
            <h4>Servicios Incluidos:</h4>
            <ul>${serviciosList}</ul>
        `;
        container.appendChild(reservacionElement);
    });
}

function mostrarReservaciones(reservaciones) {
    const container = document.getElementById('reservacionesContainer');
    container.innerHTML = '';

    if (reservaciones.length === 0) {
        container.innerHTML = '<p>No tienes reservaciones aún.</p>';
        return;
    }

    reservaciones.forEach(reservacion => {
        const reservacionElement = document.createElement('div');
        reservacionElement.classList.add('reservacion-item');
        
        // Crear una lista de servicios
        let serviciosList = '';
        if (reservacion.servicios.length > 0) {
            serviciosList = reservacion.servicios.map(servicio => `<li>${servicio}</li>`).join('');
        } else {
            serviciosList = '<li>No hay servicios adicionales</li>';
        }

        // Botones para modificar y cancelar
        const modificarBtn = `<button onclick="modificarReservacion(${reservacion.id_reservacion})">Modificar</button>`;
        const cancelarBtn = `<button onclick="cancelarReservacion(${reservacion.id_reservacion})">Cancelar</button>`;

        reservacionElement.innerHTML = `
            <h3>Reservación ID: ${reservacion.id_reservacion}</h3>
            <p>Habitación: ${reservacion.nombre_habitacion}</p>
            <p>Fecha de Ingreso: ${new Date(reservacion.fecha_ingreso).toLocaleDateString()}</p>
            <p>Fecha de Salida: ${new Date(reservacion.fecha_salida).toLocaleDateString()}</p>
            <p>Total: Q${reservacion.costo_total.toFixed(2)}</p>
            <h4>Servicios Incluidos:</h4>
            <ul>${serviciosList}</ul>
            ${modificarBtn}
            ${cancelarBtn}
        `;
        container.appendChild(reservacionElement);
    });
}

// Función para cancelar una reservación
async function cancelarReservacion(id_reservacion) {
    const token = localStorage.getItem('token');
    
    if (confirm('¿Estás seguro de que deseas cancelar esta reservación?')) {
        try {
            const response = await fetch(`http://localhost:3000/api/reservaciones/cancel/${id_reservacion}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.reload();
            } else {
                alert('Error al cancelar la reservación: ' + result.message);
            }
        } catch (error) {
            console.error('Error al cancelar la reservación:', error);
            alert('Error al cancelar la reservación.');
        }
    }
}


// Función para modificar una reservación
function modificarReservacion(id_reservacion) {
    // Redirigir a una página de edición, puedes pasar el id_reservacion por query params
    window.location.href = `editarReservacion.html?id_reservacion=${id_reservacion}`;
}


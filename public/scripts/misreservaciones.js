// Variables globales para almacenar los precios de habitaciones y servicios
let preciosHabitaciones = {};
let preciosServicios = {};


document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (!token) {
        alert('Debes iniciar sesión para ver tus reservaciones.');
        window.location.href = 'login.html';
        return;
    }

    try {
        let response;
        // Si el rol es "admin", cargar todas las reservaciones, si no, solo las del usuario
        if (rol === 'admin') {
            response = await fetch('http://localhost:3000/api/reservaciones', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            response = await fetch('http://localhost:3000/api/reservaciones/usuario', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }

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
        if (reservacion.servicios && reservacion.servicios.length > 0) {
            serviciosList = reservacion.servicios.map(servicio => `<li>${servicio}</li>`).join('');
        } else {
            serviciosList = '<li>No hay servicios adicionales</li>';
        }

        // Mostrar información de la reservación según tenga habitación o paquete
        let detallesReservacion = '';
        if (reservacion.nombre_paquete) {
            detallesReservacion = `
                <p>Paquete: ${reservacion.nombre_paquete}</p>
                <p>Incluye la habitación: ${reservacion.nombre_habitacion || 'Habitación no disponible'}</p>
            `;
        } else {
            detallesReservacion = `
                <p>Habitación: ${reservacion.nombre_habitacion || 'Habitación no disponible'}</p>
            `;
        }

        // Botones para modificar y cancelar
        const modificarBtn = `<button onclick="modificarReservacion(${reservacion.id_reservacion})">Modificar</button>`;
        const cancelarBtn = `<button onclick="cancelarReservacion(${reservacion.id_reservacion})">Cancelar</button>`;

        // Renderizar la información de la reservación en el contenedor
        reservacionElement.innerHTML = `
            <h3>Reservación ID: ${reservacion.id_reservacion}</h3>
            <p>Fecha de Ingreso: ${new Date(reservacion.fecha_ingreso).toLocaleDateString()}</p>
            <p>Fecha de Salida: ${new Date(reservacion.fecha_salida).toLocaleDateString()}</p>
            ${detallesReservacion} <!-- Mostrar detalles de paquete o habitación -->
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


// Función para modificar una reservación (ahora abre el popup)
function modificarReservacion(id_reservacion) {
    // Obtener los datos de la reservación específica desde la API
    fetch(`http://localhost:3000/api/reservaciones/${id_reservacion}`)
        .then(response => response.json())
        .then(reservacion => {
            // Cargar el formulario de actualización en el popup
            const updateForm = `
                <label for="newIdHabitacion">Nueva habitación:</label>
                <select id="newIdHabitacion" name="newIdHabitacion"></select><br>

                <label for="serviciosContainer">Servicios:</label>
                <div id="serviciosContainer"></div><br>

                <label for="newCostoTotal">Nuevo costo total:</label>
                <input type="text" id="newCostoTotal" readonly><br>

                <label for="newMetodoPago">Nuevo método de pago:</label>
                <input type="text" id="newMetodoPago" value="${reservacion.metodo_pago}"><br>

                <label for="newFechaIngreso">Nueva fecha de ingreso:</label>
                <input type="date" id="newFechaIngreso" value="${new Date(reservacion.fecha_ingreso).toISOString().split('T')[0]}"><br>

                <label for="newFechaSalida">Nueva fecha de salida:</label>
                <input type="date" id="newFechaSalida" value="${new Date(reservacion.fecha_salida).toISOString().split('T')[0]}"><br>

                <button id="saveChanges">Guardar cambios</button>
            `;

            document.getElementById('updateFormContainer').innerHTML = updateForm;

            // Cargar los datos de habitaciones y servicios, y abrir el popup
            cargarDatosFormularioActualizacion(reservacion);
            openModal('updateModal'); // Abrir el modal

            // Añadir evento al botón para guardar cambios
            document.getElementById('saveChanges').onclick = async () => {
                const newIdHabitacion = document.getElementById('newIdHabitacion').value;
                const newServicios = Array.from(document.querySelectorAll('input[name="servicios"]:checked')).map(cb => cb.value); // Array de servicios
                const newCostoTotal = parseFloat(document.getElementById('newCostoTotal').value.replace('Q', ''));
                const newMetodoPago = document.getElementById('newMetodoPago').value;
                const newFechaIngreso = document.getElementById('newFechaIngreso').value;
                const newFechaSalida = document.getElementById('newFechaSalida').value;
            
                // Asegurarse de que se envíe un array para 'servicios'
                await updateReservacion(id_reservacion, newIdHabitacion, newServicios.length > 0 ? newServicios : [], newCostoTotal, newMetodoPago, newFechaIngreso, newFechaSalida);
            };            
        })
        .catch(error => {
            console.error('Error al cargar los datos de la reservación:', error);
        });
}

// Función para cargar habitaciones y servicios en el formulario de actualización
async function cargarDatosFormularioActualizacion(reservacion) {
    try {
        const response = await fetch('/api/paquetes/datos/formulario');
        const { habitaciones, servicios } = await response.json();

        // Cargar habitaciones en el select
        const habitacionSelect = document.getElementById('newIdHabitacion');
        habitacionSelect.innerHTML = '';

        habitaciones.forEach(habitacion => {
            const option = document.createElement('option');
            option.value = habitacion.id;
            option.textContent = `${habitacion.nombre} - $${habitacion.precio}`;
            preciosHabitaciones[habitacion.id] = habitacion.precio;

            if (habitacion.id == reservacion.id_habitacion) {
                option.selected = true;
            }

            habitacionSelect.appendChild(option);
        });

        habitacionSelect.addEventListener('change', calcularPrecioTotal);

        // Cargar servicios en los checkboxes
        const serviciosContainer = document.getElementById('serviciosContainer');
        serviciosContainer.innerHTML = '';

        servicios.forEach(servicio => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'servicios';
            checkbox.value = servicio.id;
            preciosServicios[servicio.id] = servicio.costo;

            if (Array.isArray(reservacion.servicios) && reservacion.servicios.some(s => s.ID == servicio.id || s.id == servicio.id)) {
                checkbox.checked = true;
            }
            

            checkbox.addEventListener('change', calcularPrecioTotal);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(`${servicio.nombre} - $${servicio.costo}`));
            serviciosContainer.appendChild(label);
        });

        calcularPrecioTotal();
    } catch (error) {
        console.error('Error al cargar habitaciones y servicios:', error);
    }
}

// Función para calcular el precio total de la reservación
function calcularPrecioTotal() {
    let precioTotal = 0;

    const habitacionId = document.getElementById('newIdHabitacion').value;
    if (habitacionId && preciosHabitaciones[habitacionId]) {
        precioTotal += preciosHabitaciones[habitacionId];
    }

    const serviciosSeleccionados = Array.from(document.querySelectorAll('input[name="servicios"]:checked'));
    serviciosSeleccionados.forEach(servicio => {
        const servicioId = servicio.value;
        if (preciosServicios[servicioId]) {
            precioTotal += preciosServicios[servicioId];
        }
    });

    document.getElementById('newCostoTotal').value = `Q${precioTotal.toFixed(2)}`;
}

// Función para abrir un modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block'; // Cambia la visibilidad del modal
    } else {
        console.error('No se encontró el modal con el ID:', modalId);
    }
}

// Función para cerrar el modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('No se encontró el modal con el ID:', modalId);
    }
}

// Función para actualizar una reservación
async function updateReservacion(id_reservacion, newIdHabitacion, newServicios, newCostoTotal, newMetodoPago, newFechaIngreso, newFechaSalida) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`http://localhost:3000/api/reservaciones/update/${id_reservacion}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_habitacion: newIdHabitacion,
                servicios: newServicios,
                costo_total: newCostoTotal,
                metodo_pago: newMetodoPago,
                fecha_ingreso: newFechaIngreso,
                fecha_salida: newFechaSalida
            })
        });
        
        const result = await response.json();

        if (response.ok) {
            alert('Reservación actualizada exitosamente');
            window.location.reload(); // Recargar la página después de la actualización
        } else {
            alert('Error al actualizar la reservación: ' + result.message);
        }
    } catch (error) {
        console.error('Error al actualizar la reservación:', error);
        alert('Error al actualizar la reservación.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');

    if (!token) {
        alert('Debes iniciar sesión para ver tus reservaciones.');
        window.location.href = 'login.html';
        return;
    }

    try {
        let response;
        // Si el rol es "admin", cargar todas las reservaciones, si no, solo las del usuario
        if (rol === 'admin') {
            response = await fetch('http://localhost:3000/api/reservaciones', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        } else {
            response = await fetch('http://localhost:3000/api/reservaciones/usuario', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }

        const reservaciones = await response.json();

        // Agregar una verificación para asegurarse de que la respuesta sea un array
        if (response.ok && Array.isArray(reservaciones)) {
            mostrarReservaciones(reservaciones);
        } else {
            console.error('La respuesta no es un array o hubo un error:', reservaciones);
            alert('Error al cargar reservaciones: ' + (reservaciones.message || 'Datos no válidos.'));
        }
    } catch (error) {
        console.error('Error al obtener las reservaciones:', error);
        alert('Error al obtener las reservaciones.');
    }
});

function mostrarReservaciones(reservaciones) {
    const container = document.getElementById('reservacionesContainer');
    container.innerHTML = '';

    // Verificación adicional antes de intentar recorrer el array
    if (!Array.isArray(reservaciones) || reservaciones.length === 0) {
        container.innerHTML = '<p>No tienes reservaciones aún.</p>';
        return;
    }

    reservaciones.forEach(reservacion => {
        console.log('Datos de la reservación:', reservacion); // Para ver la estructura de la reservación en la consola
    
        const reservacionElement = document.createElement('div');
        reservacionElement.classList.add('reservacion-item');
        
        // Crear una lista de servicios
        let serviciosList = '';
        if (reservacion.servicios && reservacion.servicios.length > 0) {
            serviciosList = reservacion.servicios.map(servicio => `<li>${servicio}</li>`).join('');
        } else {
            serviciosList = '<li>No hay servicios adicionales</li>';
        }
    
        // Botones para modificar y cancelar
        const modificarBtn = `<button onclick="modificarReservacion(${reservacion.id_reservacion})">Modificar</button>`;
        const cancelarBtn = `<button onclick="cancelarReservacion(${reservacion.id_reservacion})">Cancelar</button>`;
    
        // Agregar el nombre del usuario en la interfaz
        reservacionElement.innerHTML = `
            <h3>Reservación ID: ${reservacion.id_reservacion}</h3>
            <p>Usuario: ${reservacion.nombre_usuario || 'Usuario no disponible'}</p>  <!-- Mostrar el nombre del usuario -->
            <p>Habitación: ${reservacion.nombre_habitacion || 'Nombre de la habitación no disponible'}</p>
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

const rol = localStorage.getItem('rol');

// Función para abrir el popup (tanto registro como actualización)
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

// Función para cerrar el popup
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Ocultar el botón de agregar reservación si el rol no es admin
document.getElementById('openRegisterModal').style.display = (rol === 'admin') ? 'block' : 'none';

// Agregar un EventListener para abrir el modal cuando se haga clic en el botón "Agregar Reservación"
document.getElementById('openRegisterModal').addEventListener('click', () => {
    openModal('registerModal'); // Llama a la función para abrir el modal de registro
});

// Añadir el evento para cerrar el popup de registro
document.getElementById('closeRegisterModal').addEventListener('click', () => closeModal('registerModal'));

// Añadir el evento para cerrar el popup de actualización
document.getElementById('closeUpdateModal').addEventListener('click', () => closeModal('updateModal'));

// Función para cargar las reservaciones y mostrarlas en la lista
async function cargarReservaciones() {
    try {
        const response = await fetch('/api/reservaciones');
        const reservaciones = await response.json();

        // Limpiar la lista antes de mostrar las reservaciones
        const reservacionesList = document.getElementById('reservaciones-list');
        reservacionesList.innerHTML = '';

        // Recorrer las reservaciones y agregarlas a la lista
        reservaciones.forEach(reservacion => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${reservacion.id_reservacion}</td>
                <td>${reservacion.id_usuario}</td>
                <td>${reservacion.id_habitacion}</td>
                <td>${reservacion.id_paquete ? reservacion.id_paquete : 'N/A'}</td>
                <td>Q${reservacion.costo_total.toFixed(2)}</td>
                <td>${reservacion.metodo_pago}</td>
                <td>${new Date(reservacion.fecha_ingreso).toLocaleDateString()}</td>
                <td>${new Date(reservacion.fecha_salida).toLocaleDateString()}</td>
            `;

            if (rol === 'admin') {
                // Botón para actualizar
                const updateBtn = document.createElement('button');
                updateBtn.textContent = 'Actualizar';
                updateBtn.onclick = () => {
                    // Crear el formulario de actualización
                    const updateForm = `
                        <label for="newIdHabitacion">Nueva habitación:</label>
                        <input type="number" id="newIdHabitacion" value="${reservacion.id_habitacion}"><br>

                        <label for="newIdPaquete">Nuevo paquete (opcional):</label>
                        <input type="number" id="newIdPaquete" value="${reservacion.id_paquete ? reservacion.id_paquete : ''}"><br>

                        <label for="newCostoTotal">Nuevo costo total:</label>
                        <input type="number" id="newCostoTotal" step="0.01" value="${reservacion.costo_total}"><br>

                        <label for="newMetodoPago">Nuevo método de pago:</label>
                        <input type="text" id="newMetodoPago" value="${reservacion.metodo_pago}"><br>

                        <label for="newFechaIngreso">Nueva fecha de ingreso:</label>
                        <input type="date" id="newFechaIngreso" value="${new Date(reservacion.fecha_ingreso).toISOString().split('T')[0]}"><br>

                        <label for="newFechaSalida">Nueva fecha de salida:</label>
                        <input type="date" id="newFechaSalida" value="${new Date(reservacion.fecha_salida).toISOString().split('T')[0]}"><br>

                        <button id="saveChanges">Guardar cambios</button>
                    `;

                    // Cargar el formulario en el contenedor del popup
                    document.getElementById('updateFormContainer').innerHTML = updateForm;
                    openModal('updateModal'); // Mostrar el popup

                    // Manejar el envío del formulario de actualización
                    document.getElementById('saveChanges').onclick = async () => {
                        const newIdHabitacion = document.getElementById('newIdHabitacion').value;
                        const newIdPaquete = document.getElementById('newIdPaquete').value || null;
                        const newCostoTotal = document.getElementById('newCostoTotal').value;
                        const newMetodoPago = document.getElementById('newMetodoPago').value;
                        const newFechaIngreso = document.getElementById('newFechaIngreso').value;
                        const newFechaSalida = document.getElementById('newFechaSalida').value;

                        await updateReservacion(reservacion.id_reservacion, newIdHabitacion, newIdPaquete, newCostoTotal, newMetodoPago, newFechaIngreso, newFechaSalida);
                        closeModal('updateModal');
                    };
                };
                row.appendChild(updateBtn);

                // Botón para eliminar
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.classList.add('delete');
                deleteBtn.onclick = () => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta reservación?')) {
                        deleteReservacion(reservacion.id_reservacion);
                    }
                };
                row.appendChild(deleteBtn);
            }
            reservacionesList.appendChild(row);
        });
    } catch (error) {
        console.error('Error al cargar las reservaciones:', error);
    }
}

// Función para actualizar una reservación
async function updateReservacion(id, id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida) {
    try {
        const response = await fetch(`/api/reservaciones/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id_habitacion, id_paquete, costo_total, metodo_pago, fecha_ingreso, fecha_salida })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Reservación actualizada exitosamente');
            cargarReservaciones(); // Recargar la lista de reservaciones
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error al actualizar la reservación:', error);
    }
}

// Función para eliminar una reservación
async function deleteReservacion(id) {
    try {
        const response = await fetch(`/api/reservaciones/delete/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (response.ok) {
            alert('Reservación eliminada exitosamente');
            cargarReservaciones(); // Recargar la lista de reservaciones
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error al eliminar la reservación:', error);
    }
}

// Cargar las reservaciones cuando se cargue la página
cargarReservaciones();

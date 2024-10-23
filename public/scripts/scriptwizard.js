let currentStep = 1;
let selectedHabitacion = null;
let selectedServicios = [];
let preciosServicios = {};
let total = 0;
let fechaEntrada = null;
let fechaSalida = null;


async function confirmarReservacion() {
    // Obtener el token almacenado en el localStorage
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Debes iniciar sesión para hacer una reservación');
        return;
    }

    // Decodificar el token para obtener el ID del usuario
    const decoded = jwt_decode(token);
    console.log('Token decodificado:', decoded);  // <-- Verifica el contenido del token decodificado aquí
    const id_usuario = decoded.id || decoded.userId;  // Asegúrate de que el token contenga este campo

    // Crear el objeto de datos para la reservación
    const data = {
        id_usuario: id_usuario,  // Usar el ID dinámico del usuario
        id_habitacion: selectedHabitacion.id,
        id_paquete: null,
        costo_total: total,
        metodo_pago: document.getElementById('metodo-pago').value,
        fecha_ingreso: fechaEntrada,
        fecha_salida: fechaSalida,
        servicios: selectedServicios
    };

    console.log('Datos enviados al servidor:', data);  // Verificar qué datos se están enviando

    // Enviar la solicitud al servidor
    const response = await fetch('http://localhost:3000/api/reservaciones/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok && result.success) {
        alert('Reservación creada exitosamente.');
    } else {
        alert('' + result.message);
    }
}


// Avanzar al siguiente paso
function nextStep() {
    if (validateStep(currentStep)) {
        currentStep++;
        showStep(currentStep);
    }
}

// Regresar al paso anterior
function prevStep() {
    currentStep--;
    showStep(currentStep);
}

// Mostrar el paso actual
function showStep(step) {
    document.querySelectorAll('.step-content').forEach((el) => {
        el.style.display = 'none';
    });
    document.querySelector(`#step-${step}`).style.display = 'block';
    
    // Si estamos en el paso 2, mostrar la habitación seleccionada
    if (step === 2) {
        displaySelectedHabitacion();
    }

    updateStepsIndicator(step);
}

// Validar el paso actual
function validateStep(step) {
    if (step === 1) {
        if (!selectedHabitacion) {
            alert("Debes seleccionar una habitación.");
            return false;
        }

        const entrada = document.getElementById('fecha-entrada').value;
        const salida = document.getElementById('fecha-salida').value;

        // Validar que se hayan seleccionado ambas fechas
        if (!entrada || !salida) {
            alert("Debes seleccionar una fecha de entrada y salida.");
            return false;
        }

        const fechaHoy = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD

        // Validar que la fecha de entrada no sea anterior a la de hoy
        if (entrada < fechaHoy) {
            alert("La fecha de entrada no puede ser anterior a hoy.");
            return false;
        }

        // Validar que la fecha de salida sea mayor que la fecha de entrada
        if (entrada >= salida) {
            alert("La fecha de salida debe ser posterior a la fecha de entrada.");
            return false;
        }

        // Almacenar las fechas si son válidas
        fechaEntrada = entrada;
        fechaSalida = salida;
    }
    return true;
}

// Actualizar el indicador de pasos
function updateStepsIndicator(step) {
    document.querySelectorAll('.steps-indicator .step').forEach((el, index) => {
        if (index < step) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });
}

// Establecer la fecha mínima en el campo de entrada (la fecha actual)
function setMinFechaEntrada() {
    const fechaHoy = new Date().toISOString().split('T')[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD
    document.getElementById('fecha-entrada').setAttribute('min', fechaHoy);
    document.getElementById('fecha-salida').setAttribute('min', fechaHoy);
}

// Cargar habitaciones desde la API
function loadHabitaciones() {
    fetch('/api/habitaciones')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('habitaciones-container');
            container.innerHTML = '';
            data.forEach(habitacion => {
                const habitacionCard = document.createElement('div');
                habitacionCard.classList.add('habitacion-card');
                habitacionCard.innerHTML = `
                    <img src="data:image/jpeg;base64,${habitacion.imagen}" alt="${habitacion.nombre}" />
                    <h4>${habitacion.nombre}</h4>
                    <p>${habitacion.descripcion}</p>
                    <p class="price">Precio: Q${habitacion.precio}</p>
                    <button onclick="selectHabitacion(${habitacion.id}, '${habitacion.nombre}', '${habitacion.descripcion}', '${habitacion.imagen}', ${habitacion.precio})">Seleccionar</button>
                `;
                container.appendChild(habitacionCard);
            });
        })
        .catch(error => {
            console.error('Error al cargar las habitaciones:', error);
            alert('Error al cargar habitaciones');
        });
}

// Seleccionar habitación
function selectHabitacion(id, nombre, descripcion, imagen, precio) {
    console.log('Datos de la habitación seleccionada:', { id, nombre, descripcion, imagen, precio });
    
    if (!id || !precio) {
        console.error('ID o precio no definidos:', { id, precio });
        alert('Error al seleccionar la habitación, faltan datos.');
        return;
    }

    selectedHabitacion = { id, nombre, descripcion, imagen, precio };  // Almacenar todos los detalles de la habitación seleccionada
    total = precio;
    alert(`Has seleccionado la habitación con ID: ${id}, Precio: Q${precio}`);
}


// Mostrar la habitación seleccionada en el paso 2
function displaySelectedHabitacion() {
    const selectedHabitacionContainer = document.getElementById('selected-habitacion-container');
    
    if (selectedHabitacion) {
        selectedHabitacionContainer.innerHTML = `
            <h4>Habitación seleccionada</h4>
            <img src="data:image/jpeg;base64,${selectedHabitacion.imagen}" alt="${selectedHabitacion.nombre}" style="width:200px; height:auto;"/>
            <p><strong>${selectedHabitacion.nombre}</strong></p>
            <p>${selectedHabitacion.descripcion}</p>
            <p>ID: ${selectedHabitacion.id}</p>
            <p class="price">Total: Q${selectedHabitacion.precio.toFixed(2)}</p> <!-- Asegúrate de que la clase 'price' esté presente -->
        `;
    } else {
        selectedHabitacionContainer.innerHTML = '<p>No has seleccionado ninguna habitación.</p>';
    }
}



// Cargar servicios desde la API
function loadServicios() {
    fetch('/api/servicios')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('servicios-container');
            container.innerHTML = '';
            data.forEach(servicio => {
                const servicioCard = document.createElement('div');
                servicioCard.classList.add('servicio-card');
                
                // Almacenar el precio del servicio en preciosServicios
                preciosServicios[servicio.id] = servicio.costo;
                
                servicioCard.innerHTML = `
                    <img src="data:image/jpeg;base64,${servicio.imagen}" alt="${servicio.nombre}" />
                    <h4>${servicio.nombre}</h4>
                    <p class="price">Precio: Q${servicio.costo}</p>
                    <input type="checkbox" value="${servicio.id}" data-costo="${servicio.costo}" onchange="toggleServicio(${servicio.id}, ${servicio.costo})">
                `;
                container.appendChild(servicioCard);
            });
        })
        .catch(error => {
            console.error('Error al cargar los servicios:', error);
            alert('Error al cargar servicios');
        });

    // Después de cargar todos los servicios, inicializamos el cálculo
    calcularPrecioTotal();
}


//Calcular precios
function calcularPrecioTotal() {
    // Calcular la cantidad de noches de estadía
    if (!fechaEntrada || !fechaSalida) {
        console.error("No se han seleccionado las fechas de entrada y salida.");
        return;
    }

    const fecha1 = new Date(fechaEntrada);
    const fecha2 = new Date(fechaSalida);
    const diferenciaTiempo = fecha2.getTime() - fecha1.getTime();
    const cantidadNoches = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24)); // Convertir a días

    let totalPrecio = selectedHabitacion ? selectedHabitacion.precio * cantidadNoches : 0;

    // Sumar los precios de los servicios seleccionados
    selectedServicios.forEach(servicioId => {
        if (preciosServicios[servicioId]) {
            totalPrecio += preciosServicios[servicioId];
        }
    });

    total = totalPrecio; // Actualizar el total global

    // Verificar si el contenedor de la habitación seleccionada existe
    const resumenContainer = document.getElementById('selected-habitacion-container');
    
    if (resumenContainer) {
        const priceElement = resumenContainer.querySelector('.price');
        if (priceElement) {
            priceElement.textContent = `Total: Q${totalPrecio.toFixed(2)}`;
        }
    }
}





// Alternar selección de servicios adicionales
function toggleServicio(id, costo) {
    const index = selectedServicios.indexOf(id);
    if (index > -1) {
        // Si el servicio ya está seleccionado, lo quitamos
        selectedServicios.splice(index, 1);
    } else {
        // Si no está seleccionado, lo añadimos
        selectedServicios.push(id);
    }

    // Recalcular el precio total
    calcularPrecioTotal();
}


// Actualizar el resumen de la reserva
function updateResumen() {
    const resumenContainer = document.getElementById('resumen-container');
    resumenContainer.innerHTML = `
        <p>Habitación seleccionada: Q${selectedHabitacion.precio}</p>
        <p>Servicios adicionales: Q${selectedServicios.reduce((acc, servicio) => acc + servicio.costo, 0)}</p>
        <p>Total: Q${total}</p>
    `;
}


// Inicializar el wizard
function initWizard() {
    const urlParams = new URLSearchParams(window.location.search);
    const habitacionId = urlParams.get('id');

    if (habitacionId) {
        // Seleccionar automáticamente la habitación si el ID está en la URL
        selectHabitacionPorId(habitacionId);
    }

    setMinFechaEntrada();  // Establecer la fecha mínima en los campos de fecha
    loadHabitaciones();
    loadServicios();
    showStep(1);
}

function selectHabitacionPorId(id) {
    fetch(`/api/habitaciones/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al obtener la habitación: ${response.statusText}`);
            }
            return response.json();
        })
        .then(habitacion => {
            console.log('Habitación obtenida:', habitacion);  // Verificar cómo se reciben los datos

            // Asegúrate de que habitacion sea un arreglo con los valores correctos
            if (habitacion && habitacion.length > 3) {
                // Desestructuramos el arreglo para obtener los datos
                const [id, nombre, descripcion, precio] = habitacion;
                selectHabitacion(id, nombre, descripcion, '', precio);  // Asigna los valores correctos
            } else {
                console.error('Datos incompletos de la habitación:', habitacion);
                alert('Los datos de la habitación están incompletos.');
            }
        })
        .catch(error => {
            console.error('Error al seleccionar la habitación:', error);
            alert('No se pudo cargar la habitación seleccionada.');
        });
}



document.addEventListener('DOMContentLoaded', initWizard);

const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : 'https://proyecto3-0.onrender.com/api';

let currentStep = 1;
let selectedHabitacion = null;
let selectedServicios = [];
let preciosServicios = {};
let total = 0;
let fechaEntrada = null;
let fechaSalida = null;
let paqueteId = null;

let stripe, elements, cardNumber, cardExpiry, cardCvc, cardZip;

// Inicializar Stripe Elements
function initializeStripeElements() {
    if (!stripe) {
        console.log("Inicializando Stripe Elements");
        stripe = Stripe('pk_test_51Q9B1WRvmJhKXph8QE0FpzBgIwDpJsXa5G1t8zayNZTWYjoMbFBI6mJ1Gf9dSnDIT3xgztPNRAop9YZHyiB0CPFP00ryAjfoGg');
        elements = stripe.elements();

        cardNumber = elements.create('cardNumber');
        cardExpiry = elements.create('cardExpiry');
        cardCvc = elements.create('cardCvc');
        cardZip = elements.create('postalCode');

        cardNumber.mount('#card-number');
        cardExpiry.mount('#card-expiry');
        cardCvc.mount('#card-cvc');
        cardZip.mount('#card-zip');

        cardNumber.on('change', handleCardInput);
        cardExpiry.on('change', handleCardInput);
        cardCvc.on('change', handleCardInput);
        cardZip.on('change', handleCardInput);
    }
}

function handleCardInput(event) {
    const displayError = document.getElementById('card-errors');
    displayError.textContent = event.error ? event.error.message : '';
}

async function procesarPagoStripe() {
    const cardholderName = document.getElementById('cardholder-name').value;
    const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardNumber,
        billing_details: {
            name: cardholderName,
        },
    });

    if (error) {
        document.getElementById('card-errors').textContent = error.message;
    } else {
        const response = await fetch(`${API_BASE_URL}/pagos/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                costo_total: total * 100,
                id_usuario: localStorage.getItem('userId')
            })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message);
            confirmarReservacion();
            currentStep = 5;
            showStep(currentStep);
        } else {
            alert(`Error en el pago: ${result.error}`);
        }
    }
}

// Capturar parámetros de la URL
function getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        paquete_id: params.get('paquete_id')
    };
}

async function confirmarReservacion() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Debes iniciar sesión para hacer una reservación');
        return;
    }

    const decoded = jwt_decode(token);
    const id_usuario = decoded.id || decoded.userId;

    if (!selectedHabitacion && !paqueteId) {
        alert('Debes seleccionar una habitación o un paquete.');
        return;
    }

    if (!fechaEntrada || !fechaSalida) {
        alert('Debes seleccionar las fechas de entrada y salida.');
        return;
    }

    if (!document.getElementById('metodo-pago').value) {
        alert('Debes seleccionar un método de pago.');
        return;
    }

    const data = {
        id_usuario: id_usuario,
        id_habitacion: paqueteId ? null : selectedHabitacion?.id,
        id_paquete: paqueteId || null,
        costo_total: total,
        metodo_pago: document.getElementById('metodo-pago').value,
        fecha_ingreso: fechaEntrada,
        fecha_salida: fechaSalida,
        servicios: selectedServicios
    };

    const response = await fetch(`${API_BASE_URL}/reservaciones/create`,  {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    if (response.ok) {
        alert(result.message);
    } else {
        console.error('Error al crear reservación:', result);
        alert('Error: ' + result.message);
    }
}

// Avanzar al siguiente paso
function nextStep() {
    if (currentStep === 3) {
        const metodoPago = document.getElementById('metodo-pago').value;

        if (metodoPago === 'tarjeta') {
            currentStep = 4;
            showStep(currentStep);
            return;
        } else if (metodoPago === 'recepcion') {
            confirmarReservacion();
            currentStep = 5;
            showStep(currentStep);
            return;
        }
    }

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

// Mostrar la habitación seleccionada
function displaySelectedHabitacion() {
    const selectedHabitacionContainer = document.getElementById('selected-habitacion-container');

    if (selectedHabitacion) {
        const precio = parseFloat(selectedHabitacion.precio) || 0;  // Asegura que precio sea un número
        selectedHabitacionContainer.innerHTML = `
            <h4>Habitación seleccionada</h4>
            <img src="data:image/jpeg;base64,${selectedHabitacion.imagen}" alt="${selectedHabitacion.nombre}" style="width:200px; height:auto;"/>
            <p><strong>${selectedHabitacion.nombre}</strong></p>
            <p>${selectedHabitacion.descripcion}</p>
            <p>ID: ${selectedHabitacion.id}</p>
            <p class="price">Total: $${precio.toFixed(2)}</p>
        `;
    } else if (paqueteId) {
        selectedHabitacionContainer.innerHTML = `<p>Reservación de paquete seleccionada.</p>`;
    } else {
        selectedHabitacionContainer.innerHTML = '<p>No has seleccionado ninguna habitación.</p>';
    }
}


function showStep(step) {
    document.querySelectorAll('.step-content').forEach((el) => {
        el.style.display = 'none';
    });
    document.querySelector(`#step-${step}`).style.display = 'block';

    if (step === 2) {
        displaySelectedHabitacion();
        calcularPrecioTotal();
    }

    if (step === 4) {
        displaySelectedHabitacion();
        initializeStripeElements();
    }

    updateStepsIndicator(step);
}

function validateStep(step) {
    if (step === 1) {
        if (!paqueteId && !selectedHabitacion) {
            alert("Debes seleccionar una habitación.");
            return false;
        }

        const entrada = document.getElementById('fecha-entrada').value;
        const salida = document.getElementById('fecha-salida').value;

        if (!entrada || !salida) {
            alert("Debes seleccionar una fecha de entrada y salida.");
            return false;
        }

        const fechaHoy = new Date().toISOString().split('T')[0];

        if (entrada < fechaHoy) {
            alert("La fecha de entrada no puede ser anterior a hoy.");
            return false;
        }

        if (entrada >= salida) {
            alert("La fecha de salida debe ser posterior a la fecha de entrada.");
            return false;
        }

        fechaEntrada = entrada;
        fechaSalida = salida;

        // Calcular el precio total cuando las fechas son válidas
        calcularPrecioTotal();
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

// Cargar habitaciones desde la API
function loadHabitaciones() {
    fetch(`${API_BASE_URL}/habitaciones`)
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
                    <p class="price">Precio: $ ${habitacion.precio}</p>
                    <button onclick="selectHabitacion(${habitacion.id}, '${habitacion.nombre}', '${habitacion.descripcion}', '${habitacion.imagen}', ${habitacion.precio})">Seleccionar</button>
                `;
                container.appendChild(habitacionCard);
            });

            updateButtonsState();
        })
        .catch(error => {
            console.error('Error al cargar las habitaciones:', error);
            alert('Error al cargar habitaciones');
        });
}

// Seleccionar habitación
function selectHabitacion(id, nombre, descripcion, imagen, precio) {
    if (!isAuthenticated()) {
        alert('Debes iniciar sesión para comenzar con una reserva');
        window.location.href = 'login.html';
        return;
    }

    selectedHabitacion = { id, nombre, descripcion, imagen, precio };
    total = precio;

    setMinFechaEntrada();

    updateButtonsState();

    alert(`Has seleccionado la habitación con ID: ${id}, Precio: $${precio}`);
}

function updateButtonsState() {
    const buttons = document.querySelectorAll('.habitacion-card button');

    buttons.forEach(button => {
        const onclickAttr = button.getAttribute('onclick');

        if (onclickAttr) {
            const habitacionIdMatch = onclickAttr.match(/\d+/);

            if (habitacionIdMatch) {
                const habitacionId = parseInt(habitacionIdMatch[0], 10);

                if (selectedHabitacion && selectedHabitacion.id === habitacionId) {
                    button.textContent = 'Seleccionada';
                    button.disabled = true;
                    button.classList.add('selected');
                } else {
                    button.textContent = 'Seleccionar';
                    button.disabled = false;
                    button.classList.remove('selected');
                }
            } else {
                console.error("No se pudo encontrar el ID de la habitación en el botón:", button);
            }
        } else {
            console.error("El botón no tiene un atributo 'onclick' válido:", button);
        }
    });
}

// Establecer la fecha mínima en el campo de entrada y deshabilitar fechas reservadas
async function setMinFechaEntrada() {
    const fechaHoy = new Date().toISOString().split('T')[0];

    let endpoint;
    if (paqueteId) {
        endpoint = `${API_BASE_URL}/reservaciones/fechas-reservadas-paquete/${paqueteId}`;
    } else if (selectedHabitacion && selectedHabitacion.id) {
        endpoint = `${API_BASE_URL}/reservaciones/fechas-reservadas/${selectedHabitacion.id}`;
    } else {
        console.error("No se ha seleccionado una habitación o paquete.");
        return;
    }

    if (endpoint) {
        try {
            const response = await fetch(endpoint);
            const fechasReservadas = await response.json();

            const fechasDeshabilitadas = fechasReservadas.map(f => {
                const fechaInicio = new Date(f.fecha_ingreso).toISOString().split('T')[0];
                const fechaFin = new Date(f.fecha_salida).toISOString().split('T')[0];
                return { from: fechaInicio, to: fechaFin };
            });

            // Inicializar Flatpickr para los campos de fecha de entrada y salida
            flatpickr("#fecha-entrada", {
                minDate: fechaHoy,
                disable: fechasDeshabilitadas,
                onChange: function(selectedDates) {
                    const fechaSeleccionada = selectedDates[0].toISOString().split('T')[0];
                    flatpickr("#fecha-salida", {
                        minDate: fechaSeleccionada,
                        disable: fechasDeshabilitadas
                    });
                }
            });

            flatpickr("#fecha-salida", {
                minDate: fechaHoy,
                disable: fechasDeshabilitadas
            });

        } catch (error) {
            console.error('Error al cargar las fechas reservadas:', error);
        }
    }
}

// Cargar servicios desde la API
function loadServicios() {
    return new Promise((resolve, reject) => {
        fetch(`${API_BASE_URL}/servicios`)
            .then(response => response.json())
            .then(data => {
                const container = document.getElementById('servicios-container');
                container.innerHTML = '';
                data.forEach(servicio => {
                    const servicioCard = document.createElement('div');
                    servicioCard.classList.add('servicio-card');

                    preciosServicios[servicio.id] = servicio.costo;

                    servicioCard.innerHTML = `
                        <img src="data:image/jpeg;base64,${servicio.imagen}" alt="${servicio.nombre}" />
                        <h4>${servicio.nombre}</h4>
                        <p class="price">Precio: $${servicio.costo}</p>
                        <input type="checkbox" value="${servicio.id}" data-costo="${servicio.costo}" onchange="toggleServicio(${servicio.id}, ${servicio.costo})">
                    `;
                    container.appendChild(servicioCard);
                });
                resolve();
            })
            .catch(error => {
                console.error('Error al cargar los servicios:', error);
                alert('Error al cargar servicios');
                reject(error);
            });
    });
}

// Calcular precios con desglose detallado
function calcularPrecioTotal() {
    if (!fechaEntrada || !fechaSalida) {
        console.error("No se han seleccionado las fechas de entrada y salida.");
        return;
    }

    const fecha1 = new Date(fechaEntrada);
    const fecha2 = new Date(fechaSalida);
    const cantidadNoches = Math.ceil((fecha2.getTime() - fecha1.getTime()) / (1000 * 3600 * 24));

    // Cálculo del costo de la habitación
    let costoBaseHabitacion = selectedHabitacion && !isNaN(parseFloat(selectedHabitacion.precio))
        ? parseFloat(selectedHabitacion.precio)
        : 0;
    let totalHabitacion = costoBaseHabitacion * cantidadNoches;

    const porcentajeAdicionalPorNoche = 0.1;

    let costoServiciosBase = 0;
    let totalServicios = 0;

    selectedServicios.forEach(servicioId => {
        const costoBase = parseFloat(preciosServicios[servicioId]) || 0;
        if (costoBase) {
            const costoServicioConExtra = costoBase + (costoBase * porcentajeAdicionalPorNoche * cantidadNoches);
            costoServiciosBase += costoBase;
            totalServicios += costoServicioConExtra;
        } else {
            console.error(`Costo base no encontrado o no es un número para el servicio ID: ${servicioId}`);
        }
    });

    if (paqueteId) {
        console.log("paqueteId encontrado:", paqueteId); // Verifica que paqueteId no sea undefined o null
        fetch(`${API_BASE_URL}/paquetes/${paqueteId}`)
            .then(response => response.json())
            .then(paquete => {
                const precioPaquete = !isNaN(parseFloat(paquete.precio)) ? parseFloat(paquete.precio) : 0;
                const habitacionPrecio = !isNaN(parseFloat(paquete.habitacion_precio)) ? parseFloat(paquete.habitacion_precio) : 0;
                
                // Usa el precio de la habitación del paquete si existe
                if (habitacionPrecio) {
                    costoBaseHabitacion = habitacionPrecio;
                    totalHabitacion = costoBaseHabitacion * cantidadNoches;
                }
    
                total = (precioPaquete * cantidadNoches) + totalServicios;
                actualizarResumenPrecio(costoBaseHabitacion, cantidadNoches, totalHabitacion, costoServiciosBase, totalServicios);
            })
            .catch(error => {
                console.error("Error al obtener el precio del paquete:", error);
            });
    } else {
        total = totalHabitacion + totalServicios;
        actualizarResumenPrecio(costoBaseHabitacion, cantidadNoches, totalHabitacion, costoServiciosBase, totalServicios);
    }
    
    
    
    
}



// Función para actualizar el desglose del precio en la UI
function actualizarResumenPrecio(costoBaseHabitacion, cantidadNoches, totalHabitacion, costoServiciosBase, totalServicios) {
    costoBaseHabitacion = costoBaseHabitacion || 0;
    totalHabitacion = totalHabitacion || 0;
    costoServiciosBase = costoServiciosBase || 0;
    totalServicios = totalServicios || 0;

    document.getElementById("costo-base-habitacion").textContent = `$${parseFloat(costoBaseHabitacion).toFixed(2)}`;
    document.getElementById("cantidad-noches").textContent = cantidadNoches;
    document.getElementById("total-habitacion").textContent = `$${parseFloat(totalHabitacion).toFixed(2)}`;
    document.getElementById("costo-servicios-base").textContent = `$${parseFloat(costoServiciosBase).toFixed(2)}`;
    document.getElementById("total-servicios").textContent = `$${parseFloat(totalServicios).toFixed(2)}`;
    document.getElementById("total-price").textContent = `$${(parseFloat(totalHabitacion) + parseFloat(totalServicios)).toFixed(2)}`;
}


// Alternar selección de servicios adicionales
function toggleServicio(id, costo) {
    const index = selectedServicios.indexOf(id);
    if (index > -1) {
        selectedServicios.splice(index, 1);
    } else {
        selectedServicios.push(id);
    }

    // Recalcular el precio total
    calcularPrecioTotal();
}

// Actualizar el resumen de la reserva
function updateResumen() {
    const resumenContainer = document.getElementById('resumen-container');
    const totalServiciosSeleccionados = selectedServicios.reduce((acc, servicio) => acc + (preciosServicios[servicio] || 0), 0);
    resumenContainer.innerHTML = `
        <p>Habitación seleccionada: $ ${selectedHabitacion ? selectedHabitacion.precio : '0.00'}</p>
        <p>Servicios adicionales: $ ${totalServiciosSeleccionados.toFixed(2)}</p>
        <p>Total: $${total.toFixed(2)}</p>
    `;
}

// Inicializar el wizard
async function initWizard() {
    const urlParams = new URLSearchParams(window.location.search);
    paqueteId = urlParams.get('paquete_id');
    const habitacionId = urlParams.get('id');

    if (habitacionId) {
        selectHabitacionPorId(habitacionId);
    }

    await loadServicios();

    if (!paqueteId) {
        loadHabitaciones();
    } else {
        document.getElementById('habitaciones-container').style.display = 'none';
    }

    setMinFechaEntrada();

    showStep(1);
}

function selectHabitacionPorId(id) {
    fetch(`${API_BASE_URL}/habitaciones/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al obtener la habitación: ${response.statusText}`);
            }
            return response.json();
        })
        .then(habitacion => {
            if (habitacion && habitacion.id && habitacion.nombre && habitacion.descripcion && habitacion.precio) {
                const { id, nombre, descripcion, imagen, precio } = habitacion;
                selectHabitacion(id, nombre, descripcion, imagen, precio);
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

// Función para verificar si el usuario ha iniciado sesión
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return token !== null;
}

document.addEventListener('DOMContentLoaded', initWizard);

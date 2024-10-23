// Cargar lista de países al cargar la página
window.addEventListener('DOMContentLoaded', async () => {
    const countrySelect = document.getElementById('pais');

    try {
        const response = await fetch('/api/usuarios/countries');
        const countries = await response.json();

        // Llenar el <select> con la lista de países
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country.code;
            option.textContent = country.name;
            countrySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar la lista de países:', error);
    }
});

document.getElementById('usuarioForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const pais = document.getElementById('pais').value; // nuevo campo

    try {
        const response = await fetch('/api/usuarios/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, apellido, email, password, pais })
        });

        const result = await response.json();

        if (response.ok) {
            alert('Usuario registrado exitosamente');
            window.location.href = 'servicio.html'; // Redirigir a la página principal después de registrarse
        } else {
            alert(`Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
    }
});

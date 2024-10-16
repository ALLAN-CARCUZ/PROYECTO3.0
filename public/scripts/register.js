document.getElementById('usuarioForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/usuarios/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, apellido, email, password })
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

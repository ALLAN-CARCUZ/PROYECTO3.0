document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    const registerButton = document.getElementById('registerButton');
    const userGreeting = document.getElementById('userGreeting');
    const rol = localStorage.getItem('rol');  // Obtener el rol del usuario desde localStorage

    // Comprobar si el usuario está logueado verificando el token en localStorage
    function isLoggedIn() {
        const token = localStorage.getItem('token');
        console.log("Token encontrado: ", token); // Depuración
        return token !== null;  // Comprobamos si hay un token en el localStorage
    }

    // Obtener el nombre de usuario desde localStorage
    function getUsername() {
        const username = localStorage.getItem('username') || 'Usuario';
        console.log("Nombre de usuario encontrado: ", username); // Depuración
        return username;
    }

    // Función para mostrar u ocultar botones de admin
    function manageAdminButtons() {
        console.log("Verificando rol para ocultar o mostrar botones de admin.");
        const botonesAdmin = document.querySelectorAll('.admin-only');

        if (rol === 'admin') {
            // Mostrar botones solo para admin
            botonesAdmin.forEach(boton => {
                boton.style.display = 'inline-block';
            });
        } else {
            // Ocultar botones para todos los demás roles
            botonesAdmin.forEach(boton => {
                boton.style.display = 'none';
            });
        }
    }

    // Actualizar el estado de autenticación
    function updateAuthUI() {
        console.log("Rol encontrado: ", rol);  // Depuración

        if (isLoggedIn()) {
            authButton.textContent = 'Cerrar Sesión';
            userGreeting.textContent = `Hola, ${getUsername()}!`;
            registerButton.style.display = 'none';
            manageAdminButtons();  // Verificar si se muestran los botones de admin
        } else {
            authButton.textContent = 'Iniciar Sesión';
            userGreeting.textContent = '';
            registerButton.style.display = 'inline';

            // Ocultar los botones de admin si no hay sesión iniciada
            manageAdminButtons();  // Verificar si se ocultan los botones de admin
        }
    }

    // Manejar el clic en el botón de autenticación
    authButton.addEventListener('click', () => {
        if (isLoggedIn()) {
            // Cerrar sesión: eliminar el token del localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('rol');  // Asegúrate de eliminar el rol también
            alert('Cerraste sesión');
            window.location.reload();  // Recargar la página para actualizar el estado
        } else {
            // Redirigir a la página de inicio de sesión
            window.location.href = 'login.html';  // Asegúrate de que 'login.html' sea la página correcta
        }
    });

    // Inicializar el estado de la UI
    updateAuthUI();
});


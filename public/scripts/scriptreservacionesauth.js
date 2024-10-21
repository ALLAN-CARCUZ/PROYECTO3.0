document.addEventListener('DOMContentLoaded', () => {
    const authButton = document.getElementById('authButton');
    const registerButton = document.getElementById('registerButton');
    const userGreeting = document.getElementById('userGreeting');
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    // Verifica si el token existe, si existe, actualiza el saludo y oculta los botones
    if (token) {
        authButton.textContent = 'Cerrar Sesión';
        userGreeting.textContent = `Hola, ${username}`;
        registerButton.style.display = 'none';
    } else {
        authButton.textContent = 'Iniciar Sesión';
        userGreeting.textContent = '';
        registerButton.style.display = 'inline';
    }
});

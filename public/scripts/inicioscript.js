document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const loginSection = document.querySelector('.auth-section');

    if (username) {
        loginSection.innerHTML = `
            <span>Hola, ${username}!</span>
            <button class="auth-button" id="logoutBtn">Cerrar Sesión</button>
        `;
    }

    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
});

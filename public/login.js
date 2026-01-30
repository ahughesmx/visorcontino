document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorBox = document.getElementById('error-box');
    const submitBtn = document.getElementById('submit-btn');

    // Check if already logged in
    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/check');
            const data = await response.json();
            if (data.authenticated) {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    checkAuth();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Reset state
        errorBox.style.display = 'none';
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Iniciando sesión...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Success! Save user info if needed and redirect
                window.location.href = 'index.html';
            } else {
                // Show error
                errorBox.textContent = data.error || 'Credenciales inválidas';
                errorBox.style.display = 'block';
                submitBtn.disabled = false;
                submitBtn.querySelector('span').textContent = 'Entrar al Sistema';
            }
        } catch (error) {
            console.error('Login error:', error);
            errorBox.textContent = 'Error de conexión con el servidor';
            errorBox.style.display = 'block';
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Entrar al Sistema';
        }
    });
});

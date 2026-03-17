const formRegistro = document.getElementById('registroForm');
const btnVerPassword = document.getElementById('btnVerPassword');
const inputPassword = document.getElementById('password');

// 1. Lógica para el botón de Mostrar/Ocultar contraseña
if (btnVerPassword && inputPassword) {
    btnVerPassword.addEventListener('click', () => {
        // Si es tipo 'password', lo cambia a 'text' (visible), y viceversa
        const tipoActual = inputPassword.getAttribute('type');
        if (tipoActual === 'password') {
            inputPassword.setAttribute('type', 'text');
            // Cambia el color del ícono para indicar que está visible
            btnVerPassword.classList.add('text-blue-600');
        } else {
            inputPassword.setAttribute('type', 'password');
            btnVerPassword.classList.remove('text-blue-600');
        }
    });
}

// 2. Lógica del Registro
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        const nombre = document.getElementById('nombre').value;
        const correo = document.getElementById('correo').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // ¡NUEVA VALIDACIÓN UX! Revisamos que coincidan
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden. Por favor, revísalas.');
            return; // Detiene el proceso aquí mismo
        }

        try {
            // Mandamos los datos al servidor en Azure
            const respuesta = await fetch('/api/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Solo mandamos una contraseña a la BD
                body: JSON.stringify({ nombre, correo, password }) 
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                alert(datos.mensaje); 
                formRegistro.reset(); 
                window.location.href = '../index.html'; // O login.html
            } else {
                alert(datos.error); 
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor.");
        }
    });
}

// --- LÓGICA PARA EL OJITO DEL LOGIN ---
const btnVerLoginPassword = document.getElementById('btnVerLoginPassword');
const inputLoginPassword = document.getElementById('loginPassword');

if (btnVerLoginPassword && inputLoginPassword) {
    btnVerLoginPassword.addEventListener('click', () => {
        const tipoActual = inputLoginPassword.getAttribute('type');
        if (tipoActual === 'password') {
            inputLoginPassword.setAttribute('type', 'text');
            btnVerLoginPassword.classList.add('text-blue-600');
        } else {
            inputLoginPassword.setAttribute('type', 'password');
            btnVerLoginPassword.classList.remove('text-blue-600');
        }
    });
}

// --- LÓGICA PARA INICIAR SESIÓN ---
const formLogin = document.getElementById('loginForm'); // Ojo: en tu HTML le pusimos este id al form

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que recargue la página

        const correo = document.getElementById('loginCorreo').value;
        const password = document.getElementById('loginPassword').value;

        try {
            // Enviamos las credenciales al servidor
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                alert(datos.mensaje); 
                // Por ahora lo mandamos al index, luego lo mandaremos a su panel (Dashboard)
                window.location.href = '../index.html'; 
            } else {
                alert(datos.error); // Ej. "Correo o contraseña incorrectos"
            }
        } catch (error) {
            console.error("Error en login:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });
}
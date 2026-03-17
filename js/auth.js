// ==========================================
// 1. LÓGICA PARA MOSTRAR/OCULTAR CONTRASEÑAS
// ==========================================

// Para el Registro
const btnVerPassword = document.getElementById('btnVerPassword');
const inputPassword = document.getElementById('password');

if (btnVerPassword && inputPassword) {
    btnVerPassword.addEventListener('click', () => {
        const tipoActual = inputPassword.getAttribute('type');
        if (tipoActual === 'password') {
            inputPassword.setAttribute('type', 'text');
            btnVerPassword.classList.add('text-blue-600');
        } else {
            inputPassword.setAttribute('type', 'password');
            btnVerPassword.classList.remove('text-blue-600');
        }
    });
}

// Para el Login
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

// ==========================================
// 2. LÓGICA DE REGISTRO (Actualizada para Verificación)
// ==========================================

const formRegistro = document.getElementById('registroForm');

if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        const nombre = document.getElementById('nombre').value;
        const numeroCuenta = document.getElementById('numeroCuenta').value; 
        const correo = document.getElementById('correo').value; 
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden.');
            return; 
        }

        try {
            const respuesta = await fetch('/api/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, numeroCuenta, correo, password }) 
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                // --- LAS DOS LÍNEAS MÁGICAS ---
                // 1. Guardamos el número de cuenta en la "mochila" del navegador
                localStorage.setItem('cuentaPendiente', numeroCuenta);
                
                alert('¡Registro casi listo! Revisa tu correo.')

                // 2. Mandamos al usuario a la página donde pondrá su código
                window.location.href = 'verificar.html'; 
                
            } else {
                alert(datos.error); 
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor.");
        }
    });
}

// ==========================================
// 3. LÓGICA DE LOGIN (Híbrido)
// ==========================================
const formLogin = document.getElementById('loginForm');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault(); 

        // Atrapa lo que el usuario escriba, sea cuenta o sea correo
        const identificador = document.getElementById('identificador').value; 
        const password = document.getElementById('loginPassword').value;

        try {
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identificador, password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                
                localStorage.setItem('nombreUsuario', datos.nombre); 
                alert(datos.mensaje);
                // Redirige al panel del alumno
                window.location.href = 'dashboard.html'; 
            } else {
                alert(datos.error); 
            }
        } catch (error) {
            console.error("Error en login:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });
}
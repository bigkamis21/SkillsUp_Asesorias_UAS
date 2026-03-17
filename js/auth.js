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
            // Guardamos la cuenta en la mochila temporalmente para verificarla
            localStorage.setItem('cuentaPendiente', numeroCuenta);
            
            // Destapamos el cuadrito (modal) para que meta los 6 dígitos
            document.getElementById('modalVerificacion').classList.remove('hidden');
            
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
// LÓGICA DEL MODAL DE VERIFICACIÓN
// ==========================================
const btnVerificarCodigo = document.getElementById('btnVerificarCodigo');

if (btnVerificarCodigo) {
    btnVerificarCodigo.addEventListener('click', async () => {
        const codigo = document.getElementById('codigoInput').value;
        const numeroCuenta = localStorage.getItem('cuentaPendiente');

        if (!codigo || codigo.length < 6) {
            alert("Por favor ingresa los 6 dígitos.");
            return;
        }

        try {
            const res = await fetch('/api/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numeroCuenta, codigo })
            });

            const datos = await res.json();
            
            if (res.ok) {
                alert('¡Cuenta activada con éxito! Ya puedes iniciar sesión de forma segura.');
                // Solo hasta que verifica correctamente, lo mandamos al Login
                window.location.href = 'login.html';
            } else {
                alert(datos.error); // "Código incorrecto", etc.
            }
        } catch (error) {
            console.error("Error:", error);
            alert('Hubo un error al verificar el código.');
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
                localStorage.setItem('cuentaLogueada', identificador);
                localStorage.setItem('rolUsuario', datos.rol); // Guardamos su rol en la mochila

                alert(datos.mensaje);
                if (datos.rol === 'admin') {
                window.location.href = 'admin.html'; // Lo mandamos a la central
                } else if (datos.rol === 'asesor_par' || datos.rol === 'asesor_disciplinar') {
                window.location.href = 'asesor.html'; // Lo mandamos al panel de asesores

            } else {
            window.location.href = 'dashboard.html'; // Los alumnos van a la vista normal
            }

            } else {
                alert(datos.error); 
            }
        } catch (error) {
            console.error("Error en login:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });
}
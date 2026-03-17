const formRegistro = document.getElementById('registroForm');

// Solo ejecutamos esto si estamos en la página de registro
if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue

        // Sacamos los datos de los inputs
        const nombre = document.getElementById('nombre').value;
        const correo = document.getElementById('correo').value;
        const password = document.getElementById('password').value;

        try {
            // Mandamos los datos a tu servidor en Azure
            const respuesta = await fetch('/api/registrar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, correo, password })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                alert(datos.mensaje); // Te dirá "¡Registro exitoso!"
                formRegistro.reset(); // Limpia los cuadritos
                // Aquí después cambiaremos index.html por login.html
                window.location.href = '../index.html'; 
            } else {
                alert(datos.error); // Te dirá si faltó algo o si falló
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Error de conexión con el servidor de Azure.");
        }
    });
}
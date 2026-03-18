const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');

const nodemailer = require('nodemailer');

// Configuramos el transportador (quien envía el correo)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'skillsup.asesoria@gmail.com', // Tu correo de pruebas
        pass: 'cbkgifpbnkrjvurk' // La llave de 16 letras de Google
    }
});

// 1. Middleware: Debe ir arriba para entender los datos que manda el HTML
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// 2. Configuración de la conexión a la base de datos
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false } 
});

connection.connect(err => {
    if (err) {
        console.error('Error de conexión a la BD:', err);
        return;
    }
    console.log('¡Conexión exitosa a la base de datos de Azure!');
});

// 3. Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// RUTA PARA REGISTRAR (Con Cuenta y Correo)
// ==========================================
// RUTA DE REGISTRO PRO
app.post('/api/registrar', async (req, res) => {
    const { nombre, numeroCuenta, correo, password } = req.body;
    
    // 1. Validación de seguridad
    if (!nombre || !numeroCuenta || !correo || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Insertamos en la BD primero
    const query = 'INSERT INTO usuarios (nombre, numero_cuenta, correo, password, rol, codigo_verificacion, verificado) VALUES (?, ?, ?, ?, "alumno", ?, 0)';
    
    connection.query(query, [nombre, numeroCuenta, correo, password, codigo], async (err, result) => {
        if (err) {
            console.error("Error BD:", err);
            return res.status(400).json({ error: 'El número de cuenta o correo ya existen.' });
        }

        // 3. Intentamos enviar el correo
        try {
            await transporter.sendMail({
                from: '"SkillsUp UAS" <skillsup.asesoria@gmail.com>',
                to: correo,
                subject: 'Tu código de activación 🦅',
                html: `
                    <div style="font-family: sans-serif; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #1e3a8a;">¡Hola, ${nombre}!</h2>
                        <p>Tu código de seguridad para SkillsUp es:</p>
                        <h1 style="background: #f3f4f6; display: inline-block; padding: 10px 20px; border-radius: 5px; color: #1e40af;">${codigo}</h1>
                        <p style="font-size: 0.8rem; color: #666;">Si no solicitaste esto, ignora este correo.</p>
                    </div>
                `
            });
            
            // SI EL CORREO SALE BIEN:
            res.status(200).json({ mensaje: 'Código enviado con éxito.' });

        } catch (mailError) {
            console.error("Error de Gmail:", mailError);
            // SI EL CORREO FALLA: Avisamos al usuario pero NO bloqueamos la pantalla
            res.status(500).json({ error: 'Usuario creado, pero hubo un error al enviar el correo. Revisa tu configuración de Gmail.' });
        }
    });
});

app.post('/api/verificar', (req, res) => {
    const { numeroCuenta, codigo } = req.body;
    const query = 'UPDATE usuarios SET verificado = 1 WHERE numero_cuenta = ? AND codigo_verificacion = ?';
    
    connection.query(query, [numeroCuenta, codigo], (err, result) => {
        if (result.affectedRows > 0) {
            res.status(200).json({ mensaje: 'Activado' });
        } else {
            res.status(400).json({ error: 'Código incorrecto o usuario no existe' });
        }
    });
});

// ==========================================
// RUTA PARA EL LOGIN (Híbrido)
// ==========================================
app.post('/api/login', (req, res) => {
    const { identificador, password } = req.body;

    if (!identificador || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo o número de cuenta y tu contraseña.' });
    }

    // Busca esta línea en tu login y agrégale el "AND verificado = 1"
    const query = 'SELECT * FROM usuarios WHERE (correo = ? OR numero_cuenta = ?) AND password = ? AND verificado = 1';    
    connection.query(query, [identificador, identificador, password], (err, results) => {
        if (err) {
            console.error('Error al consultar la BD:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (results.length > 0) {
            const usuario = results[0];
            res.status(200).json({ 
                mensaje: `¡Bienvenido(a) de nuevo, ${usuario.nombre}!`,
                rol: usuario.rol, 
                nombre: usuario.nombre
            });
        } else {
            res.status(401).json({ error: 'Datos incorrectos. Intenta de nuevo.' });
        }
    });
});


// ==========================================
// RUTAS DE ADMINISTRADOR
// ==========================================

// 1. Obtener la lista de todos los usuarios
app.get('/api/usuarios', (req, res) => {
    // No traemos las contraseñas por seguridad
    const query = 'SELECT nombre, numero_cuenta, correo, rol, verificado FROM usuarios';
    
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }
        res.status(200).json(results);
    });
});

// 2. Cambiar el rol de un usuario
app.post('/api/cambiar-rol', (req, res) => {
    const { numeroCuenta, nuevoRol } = req.body;

    const query = 'UPDATE usuarios SET rol = ? WHERE numero_cuenta = ?';
    
    connection.query(query, [nuevoRol, numeroCuenta], (err, result) => {
        if (err) {
            console.error('Error al actualizar rol:', err);
            return res.status(500).json({ error: 'No se pudo actualizar el rol.' });
        }
        res.status(200).json({ mensaje: '¡Rol actualizado correctamente!' });
    });
});

// Obtener solicitudes pendientes para el Admin
app.get('/api/solicitudes-pendientes', (req, res) => {
    const query = `
        SELECT s.id AS solicitud_id, u.nombre AS alumno, u.numero_cuenta, u.kardex_url, m.nombre AS materia, s.motivo
        FROM solicitudes_asesor s
        JOIN usuarios u ON s.numero_cuenta = u.numero_cuenta
        JOIN materias m ON s.materia_id = m.id
        WHERE s.estado = 'pendiente'
    `;
    connection.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener solicitudes:', err);
            return res.status(500).json({ error: 'Error al cargar solicitudes.' });
        }
        res.status(200).json(results);
    });
});

// ==========================================
// RUTAS PARA SOLICITUDES DE ASESOR
// ==========================================

// 1. Obtener todas las carreras
app.get('/api/carreras', (req, res) => {
    connection.query('SELECT * FROM carreras', (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al cargar carreras' });
        res.status(200).json(results);
    });
});

// 2. Obtener materias filtradas por carrera y semestre
app.get('/api/materias/:carreraId/:semestre', (req, res) => {
    const { carreraId, semestre } = req.params;
    const query = 'SELECT * FROM materias WHERE carrera_id = ? AND semestre = ?';
    connection.query(query, [carreraId, semestre], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al cargar materias' });
        res.status(200).json(results);
    });
});

app.post('/api/solicitar-asesor', (req, res) => {
    // 1. Nos aseguramos de recibir kardexUrl del frontend
    const { numeroCuenta, materiaId, motivo, kardexUrl } = req.body;
    
    const checkQuery = 'SELECT * FROM solicitudes_asesor WHERE numero_cuenta = ? AND estado = "pendiente"';
    connection.query(checkQuery, [numeroCuenta], (err, results) => {
        if (results.length > 0) {
            return res.status(400).json({ error: 'Ya tienes una solicitud en revisión.' });
        }

        // 2. PRIMERO ACTUALIZAMOS EL KARDEX EN LA TABLA USUARIOS
        connection.query('UPDATE usuarios SET kardex_url = ? WHERE numero_cuenta = ?', [kardexUrl, numeroCuenta], (errKardex) => {
            if (errKardex) console.error('Error al guardar kardex:', errKardex);

            // 3. LUEGO CREAMOS LA SOLICITUD
            const insertQuery = 'INSERT INTO solicitudes_asesor (numero_cuenta, materia_id, motivo) VALUES (?, ?, ?)';
            connection.query(insertQuery, [numeroCuenta, materiaId, motivo], (err) => {
                if (err) return res.status(500).json({ error: 'Error al enviar la solicitud' });
                res.status(200).json({ mensaje: '¡Solicitud enviada! El administrador revisará tu Kardex pronto.' });
            });
        });
    });
});

// 3. El Admin aprueba la solicitud
app.post('/api/aprobar-asesor', (req, res) => {
    const { solicitudId, numeroCuenta } = req.body;

    // A. Cambiamos el estado de la solicitud a "aprobada"
    connection.query('UPDATE solicitudes_asesor SET estado = "aprobada" WHERE id = ?', [solicitudId], (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar solicitud' });

        // B. Ascendemos al alumno a "asesor_par"
        connection.query('UPDATE usuarios SET rol = "asesor_par" WHERE numero_cuenta = ?', [numeroCuenta], (err2) => {
            if (err2) return res.status(500).json({ error: 'Error al cambiar el rol' });
            res.status(200).json({ mensaje: 'Alumno aprobado como Asesor Par.' });
        });
    });
});

// Ruta exclusiva para que el Admin dé de alta a un profesor
app.post('/api/alta-profesor', (req, res) => {
    const { nombre, numeroEmpleado, correo, password } = req.body;

    // NOTA: Si en tu ruta de registro normal estás encriptando la contraseña con bcrypt, 
    // deberías hacerlo aquí también. Si la estás guardando en texto plano, déjalo así.
    
    // Insertamos directamente con el rol "asesor_disciplinar" y verificado = 1 (Activo)
    const query = 'INSERT INTO usuarios (nombre, numero_cuenta, correo, password, rol, verificado) VALUES (?, ?, ?, ?, "asesor_disciplinar", 1)';
    
    connection.query(query, [nombre, numeroEmpleado, correo, password], (err, result) => {
        if (err) {
            console.error('Error al registrar profesor:', err);
            return res.status(500).json({ error: 'El número de empleado o correo ya están registrados.' });
        }
        res.status(200).json({ mensaje: '¡Profesor registrado y activado con éxito!' });
    });
});

// 4. Puerto para Azure
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
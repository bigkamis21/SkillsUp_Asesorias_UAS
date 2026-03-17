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

// 4. Puerto para Azure
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');

// Configuración de la conexión usando las variables de Azure
const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false } // Requerido por Azure
});

connection.connect(err => {
    if (err) {
        console.error('Error de conexión a la BD:', err);
        return;
    }
    console.log('¡Conexión exitosa a la base de datos de Azure!');
});

// Servir tus archivos HTML (tu diseño)
app.use(express.static(path.join(__dirname, '.')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Middleware para entender los datos que manda el HTML
app.use(express.json());

// Ruta que recibe los datos del registro
app.post('/api/registrar', (req, res) => {
    const { nombre, correo, password } = req.body;
    
    // Aquí definimos que por defecto todos entran como "alumno"
    const query = 'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, "alumno")';

    connection.query(query, [nombre, correo, password], (err, result) => {
        if (err) {
            console.error('Error en BD:', err);
            return res.status(500).json({ error: 'Error al registrar en la base de datos' });
        }
        res.status(200).json({ mensaje: 'Registro exitoso' });
    });
});

// ==========================================
// RUTA PARA REGISTRAR (Con Cuenta y Correo)
// ==========================================
app.post('/api/registrar', (req, res) => {
    // Recibimos los 4 datos del frontend
    const { nombre, numeroCuenta, correo, password } = req.body;
    
    // Validamos que no falte ninguno
    if (!nombre || !numeroCuenta || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Insertamos en la base de datos (Nota que agregamos numero_cuenta y correo)
    const query = 'INSERT INTO usuarios (nombre, numero_cuenta, correo, password, rol) VALUES (?, ?, ?, ?, "alumno")';
    
    connection.query(query, [nombre, numero_cuenta, correo, password], (err, result) => {
        if (err) {
            console.error('Error al insertar en BD:', err);
            // Si el correo o la cuenta ya existen, marca error
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Ese número de cuenta o correo ya está registrado.' });
            }
            return res.status(500).json({ error: 'Hubo un error al guardar tu registro.' });
        }
        res.status(200).json({ mensaje: '¡Registro exitoso! Ya eres parte de SkillsUp.' });
    });
});

// ==========================================
// RUTA PARA EL LOGIN (Híbrido)
// ==========================================
app.post('/api/login', (req, res) => {
    // Recibimos el "identificador" (que puede ser correo o cuenta) y la contraseña
    const { identificador, password } = req.body;

    if (!identificador || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo o número de cuenta y tu contraseña.' });
    }

    // Buscamos si el identificador hace "match" con un correo OR con una cuenta
    const query = 'SELECT * FROM usuarios WHERE (correo = ? OR numero_cuenta = ?) AND password = ?';
    
    // Le pasamos el identificador dos veces para que busque en ambas columnas
    connection.query(query, [identificador, identificador, password], (err, results) => {
        if (err) {
            console.error('Error al consultar la BD:', err);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (results.length > 0) {
            const usuario = results[0];
            res.status(200).json({ 
                mensaje: `¡Bienvenido(a) de nuevo, ${usuario.nombre}!`,
                rol: usuario.rol 
            });
        } else {
            res.status(401).json({ error: 'Datos incorrectos. Intenta de nuevo.' });
        }
    });
});

// Puerto para Azure
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
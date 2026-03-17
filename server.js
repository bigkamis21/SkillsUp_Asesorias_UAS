const express = require('express');
const mysql = require('mysql2');
const app = express();
const path = require('path');

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
app.post('/api/registrar', (req, res) => {
    // Aquí recibimos la variable JS en camelCase: numeroCuenta
    const { nombre, numeroCuenta, correo, password } = req.body;
    
    if (!nombre || !numeroCuenta || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // En el query SQL usamos el nombre exacto de la columna: numero_cuenta
    const query = 'INSERT INTO usuarios (nombre, numero_cuenta, correo, password, rol) VALUES (?, ?, ?, ?, "alumno")';
    
    // Aquí le pasamos la variable JS: numeroCuenta
    connection.query(query, [nombre, numeroCuenta, correo, password], (err, result) => {
        if (err) {
            console.error('Error al insertar en BD:', err);
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
    const { identificador, password } = req.body;

    if (!identificador || !password) {
        return res.status(400).json({ error: 'Ingresa tu correo o número de cuenta y tu contraseña.' });
    }

    const query = 'SELECT * FROM usuarios WHERE (correo = ? OR numero_cuenta = ?) AND password = ?';
    
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

// 4. Puerto para Azure
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
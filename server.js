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

// IMPORTANTE: Pon esto arriba (después de definir "app = express()")
// Esto permite que el servidor lea los datos JSON que le manda la página
app.use(express.json());


// LA RUTA DEL REGISTRO
app.post('/api/registrar', (req, res) => {
    // 1. Recibimos los datos
    const { nombre, correo, password } = req.body;
    
    // 2. Validamos que no estén vacíos
    if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // 3. Preparamos la instrucción SQL (rol 'alumno' por defecto)
    const query = 'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, "alumno")';
    
    // 4. Lo guardamos en Azure MySQL
    connection.query(query, [nombre, correo, password], (err, result) => {
        if (err) {
            console.error('Error al insertar en BD:', err);
            // Si el error es por correo duplicado, mandamos un aviso amigable
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Ese correo institucional ya está registrado.' });
            }
            return res.status(500).json({ error: 'Hubo un error al guardar tu registro.' });
        }
        
        // 5. ¡Éxito!
        res.status(200).json({ mensaje: '¡Registro exitoso! Ya eres parte de SkillsUp.' });
    });
});

// Puerto para Azure
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
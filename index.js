require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const pool = require('./dbConfig'); // Importa el pool desde dbConfig.js
const habitacionRouter = require('./routes/habitacionRouter');
const servicioRouter = require('./routes/servicioRouter');
const paqueteRouter = require('./routes/paqueteRouter');
const usuarioRouter = require('./routes/usuarioRouter');
const reservacionRouter = require('./routes/reservacionRouter');
const paymentRouter = require('./routes/paymentRouter');

const app = express();
const port = process.env.PORT || 3000;

// Verificar la conexión a la base de datos al iniciar el servidor
async function connectToDatabase() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Conexión exitosa a PostgreSQL:', res.rows[0]);
    } catch (error) {
        console.error('Error al conectar a la base de datos:', error);
    }
}

connectToDatabase();

// Configuración de middlewares y enrutadores
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Usar los enrutadores para las distintas rutas
app.use('/api/habitaciones', habitacionRouter);
app.use('/api/servicios', servicioRouter);
app.use('/api/paquetes', paqueteRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/reservaciones', reservacionRouter);
app.use('/api/pagos', paymentRouter);

app.use(express.static(path.join(__dirname, 'public')));

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
});



//ORACLE_USER=ADMIN
//ORACLE_PASSWORD=123456789Umg
//ORACLE_CONNECTION=(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.mx-queretaro-1.oraclecloud.com))(connect_data=(service_name=gc3648625d63b6c_hotel_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))

//ORACLE_USER=DODO3
//ORACLE_PASSWORD=1234
//ORACLE_CONNECTION=localhost/XE

//oracle 2
//ORACLE_USER=ADMIN
//ORACLE_PASSWORD=123456789Umg
//ORACLE_CONNECTION=(description= (retry_count=20)(retry_delay=3)(address=(protocol=tcps)(port=1521)(host=adb.mx-queretaro-1.oraclecloud.com))(connect_data=(service_name=gc3648625d63b6c_hotel2_high.adb.oraclecloud.com))(security=(ssl_server_dn_match=yes)))

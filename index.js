require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb');
const path = require('path');
const habitacionRouter = require('./routes/habitacionRouter');  // Cambiar al enrutador de habitaciones
const servicioRouter = require('./routes/servicioRouter');  // Enrutador de servicios
const paqueteRouter = require('./routes/paqueteRouter')
const usuarioRouter = require('./routes/usuarioRouter');  // Enrutador de usuarios
const reservacionRouter = require('./routes/reservacionRouter');

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONNECTION,
    externalAuth: false // Si no estás usando autenticación externa
};

if (process.env.TNS_ADMIN) {
    oracledb.initOracleClient({ configDir: process.env.TNS_ADMIN });
}

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());

// Usar el enrutador de habitaciones
app.use('/api/habitaciones', habitacionRouter);  // Actualizar la ruta para habitaciones
app.use('/api/servicios', servicioRouter);  // Nueva ruta para servicios
app.use('/api/paquetes', paqueteRouter);
app.use('/api/usuarios', usuarioRouter);
app.use('/api/reservaciones', reservacionRouter);

app.use(express.static(path.join(__dirname, 'public')));

// Ejemplo de conexión a la base de datos Oracle (aquí puedes incluir otras operaciones si las necesitas)
async function connectToDatabase() {
    let connection;
    try {
        connection = await oracledb.getConnection(dbConfig);
        console.log('Conexión a Oracle exitosa');
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}

connectToDatabase();

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

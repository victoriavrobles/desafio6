const express = require('express');
const aplicacion = express();
const moment = require('moment');

//Socket
const { Server } = require("socket.io")
const http = require("http")
const server = http.createServer(aplicacion)
const io = new Server(server)

const port = 8080;
const publicRoot = './public';

aplicacion.use(express.json());
aplicacion.use(express.urlencoded({ extended: true }));

aplicacion.use(express.static(publicRoot));

const Contenedor = require("./contenedor")
const productos = new Contenedor('./productos.txt');
const mensajes = new Contenedor('./mensajes.txt');

aplicacion.get('/', (peticion, respuesta) => {
  respuesta.send('index.html', { root: publicRoot });
});


// Sockets
io.on('connection', async (socket) => {
  console.log('Nuevo cliente conectado!');

  const listaProductos = await productos.getAll();
  socket.emit('nueva-conexion', listaProductos);

  socket.on("new-product", (data) => {
    productos.save(data);
    io.sockets.emit('producto', data);
  });

  const listaMensajes = await mensajes.getAll();
  socket.emit('messages', listaMensajes);

  socket.on('new-message', async data => {
    data.time = moment(new Date()).format('DD/MM/YYYY hh:mm:ss');
    await mensajes.save(data);
    const listaMensajes = await mensajes.getAll();
    io.sockets.emit('messages', listaMensajes);
  });
});
/********** */

server.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`)
})

server.on("error", (err) => console.log(err))
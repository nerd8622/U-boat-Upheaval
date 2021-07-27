const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();

app.use(express.static(`{__dirname}/../client`));

const server = http.createServer(app);
const port = 8080;
const io = socketio(server);

io.on('connection', (sock) => {
  console.log('Connection recieved!');
});

server.on('error'), (error) => {
  console.log('An error has occured: ' + error);
});

server.listen(port, () => {
  console.log('Http server running on port' + port);
});

const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const sanitizeHtml = require('sanitize-html');
const app = express();

app.use(express.static(`${__dirname}/../client`));

const server = http.createServer(app);
const port = 8080;
const io = socketio(server);

io.on('connection', (sock) => {
  console.log('Connection recieved!');
  const serverMsg = (msg) => {
    return ['Server', '#111111', msg]
  };
  sock.emit('chat-message', serverMsg('Welcome to U-boat Upheaval, please enter a name!'));
  sock.on('login', (message) => {
    const color = randomColor();
    const name = message;
    sock.emit('chat-message', serverMsg('Hello ' + name + '! You can now use chat!'))
    const addName = (msg) => {
      let safe = sanitizeHtml(msg, {allowedTags: [ 'b', 'i' ], allowedAttributes: {}});
      return [name, color, safe];
    };

    sock.on('chat-message', (message) => {
      io.emit('chat-message', addName(message));
    });
  });
});

server.on('error', (error) => {
  console.log('An error has occured: ' + error);
});

server.listen(port, () => {
  console.log('Http server running on port ' + port);
});

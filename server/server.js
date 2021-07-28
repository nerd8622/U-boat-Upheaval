const http = require('http');
var mysql = require('mysql');
const express = require('express');
var session = require('express-session');
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const sanitizeHtml = require('sanitize-html');
const { secretStr, sqlStr } = require('./secret.js');

const sqlConnection = mysql.createConnection({
  host: 'localhost', user: 'nodejs', password: sqlStr, database: 'nodelogin'});
sqlConnection.connect((err) => {
  if(!err){console.log("MySQL Connecion Established!");}});

const app = express();

app.use(express.static(`${__dirname}/../client`));
app.use(express.urlencoded({extended: true}));
app.use(session({
  secret: secretStr,
  resave: true,
  saveUninitialized: true
}));

app.post('/auth', (req, res) => {
  let username = req.body.usr;
  let password = req.body.psw;
  if (username && password) {
		sqlConnection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], (error, results, fields) => {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/');
			} else {
				res.send('Incorrect Username and/or Password!');
			}
			res.end();
		});
	} else {
		res.send('Please enter Username and Password!');
		res.end();
	}
});

const server = http.createServer(app);
const port = 8123;
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

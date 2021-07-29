const http = require('http');
const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const socketio = require('socket.io');
const randomColor = require('randomcolor');
const sanitizeHtml = require('sanitize-html');
const { secretStr, sqlStr } = require('./secret.js');

const sqlConnection = mysql.createConnection({
  host: 'localhost', user: 'nodejs', password: sqlStr, database: 'nodelogin'});
sqlConnection.connect((err) => {
  if(!err){console.log("MySQL Connecion Established!");}});

const sessionMiddleware = session({
  secret: secretStr,
  resave: true,
  saveUninitialized: true
});

const app = express();

app.set('trust proxy', 1);
app.use(express.static(`${__dirname}/../client/static`));
app.use(express.urlencoded({extended: true}));
app.use(sessionMiddleware);

const port = 8123;
const server = http.createServer(app);
const io = socketio(server);
io.use((socket, next) => {sessionMiddleware(socket.request, {}, next);});

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

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/../client/login/index.html'));
});

app.get('/', (req, res) => {
  if (!req.session.loggedin){res.redirect('/login');}
  res.sendFile(path.join(__dirname, '/../client/index.html'));
});

io.on('connection', (sock) => {
  const username = sock.request.session.username;
  const color = randomColor();
  const addName = (msg) => {
    let safe = sanitizeHtml(msg, {allowedTags: [ 'b', 'i' ], allowedAttributes: {}});
    return [username, color, safe];
  };
  const serverMsg = (msg) => {return ['Server', '#111111', msg]};
  sock.emit('chat-message', serverMsg('Hello '+ username + '! Welcome to U-boat Upheaval!'));
  sock.on('chat-message', (message) => {
    io.emit('chat-message', addName(message));
  });
});

server.on('error', (error) => {
  console.log('An error has occured: ' + error);
});

server.listen(port, () => {
  console.log('Http server running on port ' + port);
});

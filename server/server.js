const http = require('http');
const crypto = require("crypto");
const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const socketio = require('socket.io');
const path = require('path');
const randomColor = require('randomcolor');
const sanitizeHtml = require('sanitize-html');
const { secretStr, sqlStr } = require('./secret.js');
const game = require('./game.js');

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
let games = new Map();
let players = new Map();

games.set("123456", game(22, 12));

const doUpdate = (game, id, type=false) => {
  players.get(id).sock.emit('game-update', [type, game.getUpdate(id)]);
};
const updateAll = () => {
  for (player of players.keys()){
    doUpdate(player);
  }
};
/*setInterval(() => {
  gameMgr.giveEnergy();
  updateAll();
}, 1000*60*5);*/

app.post('/auth', (req, res) => {
  let username = req.body.usr;
  let password = crypto.createHash("sha256").update(req.body.psw).digest("base64");
  if (username && password) {
		sqlConnection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], (error, results, fields) => {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				res.redirect('/');
			} else {
				res.send('Incorrect Username and/or Password!');
			}
		});
	} else {
		res.send('Please enter Username and Password!');
	}
});

app.post('/register', (req, res) => {
  let username = req.body.usr;
  let password = crypto.createHash("sha256").update(req.body.psw).digest("base64");
  let email = req.body.email;
  if (username && password && email) {
    sqlConnection.query('SELECT * FROM accounts WHERE username = ? and email = ?', [username, email], (error, results, fields) => {
      if (results.length > 0){
        res.send('The email or username you used is already taken!');
      } else {
        sqlConnection.query('INSERT INTO accounts (username, password, email) VALUES (?, ?, ?)', [username, password, email], (error, results, fields) => {
          res.redirect('/login');
        });
      }
    });
  } else {
    res.send("Missing Values!");
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '/../client/login/index.html'));
});

app.get('/', (req, res) => {
  if (!req.session.loggedin){res.redirect('/login');}
  res.sendFile(path.join(__dirname, '/../client/index.html'));
});

app.get('/game/*', (req, res) => {
  if (!req.session.loggedin){res.redirect('/login');}
  res.sendFile(path.join(__dirname, '/../client/game/index.html'));
});

io.on('connection', (sock) => {
  const gameCode = sock.request.body.code;
  const gameInst = games.get(gameCode);
  const username = sock.request.session.username;
  if (!username) {return;}
  let savedPlr = players.get(username);
  let color;
  if (savedPlr){
    color = savedPlr.color;
  } else {
    color = randomColor({luminosity: 'dark'});
  }
  players.set(username, { color: color, sock: sock });
  const addName = (msg) => {
    let safe = sanitizeHtml(msg, {allowedTags: [ 'b', 'i' ], allowedAttributes: {}});
    return [username, color, safe];
  };
  const serverMsg = (msg) => {return ['Server', '#111111', msg]};
  sock.emit('chat-message', serverMsg('Hello '+ username + '! Welcome to U-boat Upheaval!'));
  sock.emit('board', gameInst.getBoard());
  const { makeMove, makeAttack, makeScan, makeSubmerge } = gameInst.addPlayer(username);
  doUpdate(gameInst, username);
  sock.broadcast.emit('player-join', [username, color]);
  for (plr of players.keys()){
    if (plr != username){
      sock.emit('player-join', [plr, players.get(plr).color]);
    }
  }
  sock.on('chat-message', (message) => {
    sock.broadcast.emit('chat-message', addName(message));
  });
  sock.on('chat-message-private', ([recipient, message]) => {
    players.get(recipient).sock.emit('chat-message-private', addName(message));
  });
  sock.on('player-move', (message) => {
    let move = makeMove(message);
    if (move){
      for (foundSub of move){
        doUpdate(gameInst, foundSub[1], (foundSub[1] == username ? 1 : false));
      }
    }
    gameInst.giveEnergy();
    updateAll();
  });
  sock.on('player-attack', (message) => {
    let attack = makeAttack(message);
    if (attack){
      sock.emit('game-update', [1, attack]);
      doUpdate(gameInst, attack.hit[0]);
    }
  });
  sock.on('player-scan', (message) => {
    let scan = makeScan();
    if (scan){sock.emit('game-update', [3, scan]);}
  });
  sock.on('player-submerge', (message) => {
    let submerge = makeSubmerge(message);
    if (submerge){sock.emit('game-update', [false, submerge]);}
  });
});

server.on('error', (error) => {
  console.log('An error has occured: ' + error);
});

server.listen(port, () => {
  console.log('Http server running on port ' + port);
});

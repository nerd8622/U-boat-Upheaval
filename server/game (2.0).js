const randomColor = require('randomcolor');
const sanitizeHtml = require('sanitize-html');
const SimplexNoise = require('simplex-noise');
simplex = new SimplexNoise(Math.random);

class Player {
  constructor(sock){
    this.sock = sock;
    this.username = sock.request.session.username;
  }
  register(old=false){
    if (old){this.data = old.data; this.color = old.color;}
    else{
      this.color = randomColor({luminosity: 'dark'});
      let valid = 0;
      while (!valid){
        pos = [Math.round(Math.random() * xNum), Math.round(Math.random() * yNum)];
        if (board[pos[1]][pos[0]] == 0 && !playersPos[pos[0]][pos[1]]) {
          valid = 1;
      let pos =
      this.data = {id: this.username, pos: pos, stats:{health: 3, energy: 5, oxygen: 5}, neighbors: [], scans: [], visible: [], submerged: false, hit: false};
    }
    const addName = (msg) => {
      let safe = sanitizeHtml(msg, {allowedTags: [ 'b', 'i' ], allowedAttributes: {}});
      return [this.username, this.color, this.safe];
    };
    const serverMsg = (msg) => {return ['Server', '#111111', msg]};
    this.sock.emit('chat-message', serverMsg('Hello '+ username + '! Welcome to U-boat Upheaval!'));
    this.sock.on('chat-message', (message) => {
      this.sock.broadcast.emit('chat-message', addName(message));
    });
  }
  networking(){


    sock.emit('board', gameMgr.getBoard());
    const { makeMove, makeAttack, makeScan, makeSubmerge } = gameMgr.addPlayer(username);
    doUpdate(username);
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
          doUpdate(foundSub[1]);
        }
      }
      gameMgr.giveEnergy();
      updateAll();
    });
    sock.on('player-attack', (message) => {
      let attack = makeAttack(message);
      if (attack){
        sock.emit('game-update', attack);
        doUpdate(attack.hit);
      }
    });
    sock.on('player-scan', (message) => {
      let scan = makeScan();
      if (scan){sock.emit('game-update', scan);}
    });
    sock.on('player-submerge', (message) => {
      let submerge = makeSubmerge(message);
      if (submerge){sock.emit('game-update', submerge);}
    });
  }
}

class Game {
  constructor(xNum, yNum, players=16){
    this.board = new Array(yNum).fill(null).map(() => new Array(xNum).fill(null));
    terrain();
    this.maxPlayers = players, this.curPlayers = 0;
    this.playerList = new Map();
  }
  terrain(){
    for (let i = 0; i < this.yNum; i++){
      for (let j = 0; j < this.xNum; j++){
        let value, noise = simplex.noise2D(j, i);
        if (noise > 0.65) {value = 1;}
        else {value = 0;}
        this.board[i][j] = value;
      }
    }
  }
  registerPlayer(sock){
    let player = new Player(sock);
    if (!player.username) {return;}
    let old = this.playerList.get(player.username)
    if (old){this.playerList.set(player.register(old));}
    else if (curPlayers < maxPlayers){
      this.playerList.set(player.register());
      this.curPlayers += 1;
    }
  }
  validateMove(x, y, range){
    return board[y][x] == 0 && Math.abs(pos[0] - x) <= range && Math.abs(pos[1] - y) <= range;
  };

  scan(x, y, range, radar=false){
    let found = [];
    for (let i = -range; i <= range; i++){
      for (let j = -range; j <= range; j++){
        let ax = x+i, ay = y+j;
        if (ax < xNum && ay < yNum && ax >= 0 && ay >= 0){
          let plr = playersPos[ax][ay];
          if ((i || j) && plr && (!plr.submerged || radar)){
            found.push([[ax, ay], plr.id]);
          }
        }
      }
    }
    return found;
  };

  const makeMove = ([x, y]) => {
    if (!validateMove(x, y, 1) || playersPos[x][y] || data.stats.energy < 1) {return false;}
    players.set(id, [x,y]);
    playersPos[pos[0]][pos[1]] = null;
    playersPos[x][y] = data;
    pos = data.pos = [x, y];
    let nlist = data.neighbors;
    data.neighbors = scan(x, y, 1);
    nlist = [...new Set(nlist.concat(data.neighbors))];
    for (n of nlist) {
      let nx = n[0][0], ny = n[0][1];
      playersPos[nx][ny].neighbors = scan(nx, ny, 1);
    }
    let slist = data.scans;
    data.scans = [];
    for (s of slist) {
      let sx = s[0][0], sy = s[0][1];
      if (Math.abs(sx - x) > 1 || Math.abs(sy - y) > 1){data.scans.push(s);}
    }
    data.stats.energy -= 1;
    return nlist.concat([[pos, data.id]]);
  };

  const makeAttack = ([x, y]) => {
    if (!validateMove(x, y, 2) || data.stats.energy < 2) {return false;}
    let target = playersPos[x][y];
    if (target) {
      target.stats.health -= 1;
      data.stats.energy -= 2;
      let hitData = data;
      hitData.hit = target.id;
      return hitData;
    }
  };

  const makeScan = () => {
    if (data.stats.energy < 4) {return false;}
    data.stats.energy -= 4;
    data.scans = scan(pos[0], pos[1], 3, true);
    return data;
  };

  const makeSubmerge = (unsubmerge=false) => {
    if (!unsubmerge && data.stats.oxygen < 1) {return false;}
    data.submerged = !unsubmerge;
    return data;
  };
}
const game = (xNum, yNum) => {
  let board = new Array(yNum).fill(null).map(() => new Array(xNum).fill(null));
  let playersPos = new Array(xNum).fill(null).map(() => new Array(yNum).fill(null));
  let players = new Map();

  const getUpdate = (id) => {
    let p = players.get(id);
    return playersPos[p[0]][p[1]];
  };

  const giveEnergy = () => {
    for (player of players.values()) {
      if (playersPos[player[0]][player[1]].stats.energy < 5){
        playersPos[player[0]][player[1]].stats.energy += 1;
      }
    }
  };

  const addPlayer = (id) => {
    let pos = players.get(id), data;

    if (!pos) {
      let valid = 0;
      while (!valid){
        pos = [Math.round(Math.random() * xNum), Math.round(Math.random() * yNum)];
        if (board[pos[1]][pos[0]] == 0 && !playersPos[pos[0]][pos[1]]) {
          valid = 1;
          data = {id: id, pos: pos, stats:{health: 3, energy: 5, oxygen: 5}, neighbors: [], scans: [], visible: [], submerged: false, hit: false};
          playersPos[pos[0]][pos[1]] = data;
          players.set(id, pos);
        }
      }
    } else {
      data = playersPos[pos[0]][pos[1]];
    }



    return { makeMove, makeAttack, makeScan, makeSubmerge };
  }

  const getBoard = () => board;

  terrain();
  return { getBoard, addPlayer, getUpdate, giveEnergy };
};

module.exports = game;

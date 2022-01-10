const SimplexNoise = require('simplex-noise'),
simplex = new SimplexNoise(Math.random);

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

  const terrain = () => {
    for (let i = 0; i < yNum; i++){
      for (let j = 0; j < xNum; j++){
        let value, noise = simplex.noise2D(j, i);
        if (noise > 0.65) {value = 1;}
        else {value = 0;}
        board[i][j] = value;
      }
    }
  }

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

    const validateMove = (x, y, range) => {
      return board[y][x] == 0 && Math.abs(pos[0] - x) <= range && Math.abs(pos[1] - y) <= range;
    };

    const scan = (x, y, range) => {
      let found = [];
      for (let i = -range; i <= range; i++){
        for (let j = -range; j <= range; j++){
          let ax = x+i, ay = y+j;
          if (ax < xNum && ay < yNum && ax >= 0 && ay >= 0){
            let plr = playersPos[ax][ay];
            if ((i || j) && plr){
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
      data.scans = scan(pos[0], pos[1], 3);
      return data;
    };

    const makeSubmerge = (unsubmerge=false) => {
      if (!unsubmerge && data.stats.oxygen < 1) {return false;}
      data.submerged = !unsubmerge;
      return data;
    };

    return { makeMove, makeAttack, makeScan, makeSubmerge };
  }

  const getBoard = () => board;

  terrain();
  return { getBoard, addPlayer, getUpdate, giveEnergy };
};

module.exports = game;

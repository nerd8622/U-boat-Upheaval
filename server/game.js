const SimplexNoise = require('simplex-noise'),
simplex = new SimplexNoise(Math.random);

const game = (xNum, yNum) => {
  let board;
  let playersPos = new Map();
  let players = new Map();

  const arrString = (arr) => arr.join(',');

  const getUpdate = (id) => {playersPos.get(players.get(id));};

  const clear = () => {
    board = new Array(yNum).fill(null).map(() => new Array(xNum).fill(null));
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
    let pos = players.get(id);
    let data = {id: id, pos: pos, stats:{health: 3, energy: 5, oxygen: 5}, neighbors:[], visible:[]}
    if (!pos) {
      let valid = 0;
      while (!valid){
        pos = [Math.round(Math.random() * xNum), Math.round(Math.random() * yNum)];
        if (board[pos[1]][pos[0]] == 0 && !playersPos.get(arrString(pos))) {
          valid = 1;
          data.pos = pos;
          playersPos.set(arrString(pos), data);
          players.set(id, pos);
        }
      }
    }

    const validateMove = (x, y, range) => {
      return  board[y][x] == 0 && Math.abs(pos[0] - x) <= range && Math.abs(pos[1] - y) <= range;
    };

    const scan = (x, y, range) => {
      let found = [];
      for (let i = -range; i <= range; i++){
        for (let j = -range; j <= range; j++){
          let ax = x+i, ay = y+j;
          if (ax < xNum && ay < yNum && ax >= 0 && ay >= 0){
            let plr = playersPos.get(arrString([ax, ay]).id);
            if ((i || j) && plr){
              found.push([[ax, ay], plr]);
            }
          }
        }
      }
      return found;
    };

    const makeMove = ([x, y]) => {
      if (!validateMove(x, y, 1) || playersPos.get(arrString([x,y]))) {return false;}
      players.set(id, [x,y]);
      playersPos.delete(arrString(pos));
      playersPos.set(arrString([x,y]), data);
      pos = data.pos = [x, y];
      data.neighbors = scan(x, y, 1);
      return data;
    };

    const makeAttack = ([x, y]) => {
      if (!validateMove(x, y, 2)) {return false;}
      if (playersPos.get(arrString([x, y]))) {
        return true;
        // implement hitting other players
      }
    };
    return { makeMove, makeAttack };
  }

  const getBoard = () => board;

  clear();
  terrain();
  return { getBoard, addPlayer, getUpdate };
};

module.exports = game;

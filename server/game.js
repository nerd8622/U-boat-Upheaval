const SimplexNoise = require('simplex-noise'),
simplex = new SimplexNoise(Math.random);

const game = (xNum, yNum) => {
  let board;
  let playersPos = new Map();
  let players = new Map();

  const clear = () => {
    board = Array(yNum).fill(null).map(() => Array(xNum).fill(null));
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
    let pos; = players.get(id);
    if (!pos) {
      let valid = 0;
      while (!valid){
        pos = [Math.round(Math.random() * xNum), Math.round(Math.random() * yNum)];
        if (board[pos[1]][pos[0]] == 0 && !playersPos.get(pos)) {
          valid = 1;
        }
        playersPos.set(pos, id);
        players.set(id, pos);
      }
    }

    const validateMove = (x, y, range) => {
      return !playersPos.get([x,y]) && board[y][x] == 0 && Math.abs(pos[0] - x) <= range && Math.abs(pos[1] - y) <= range;
    };

    const makeMove = ([x, y]) => {
      if (!validateMove(x, y, 1)) {return false;}
      players.set(id, [x,y]);
      playersPos.delete(pos);
      playersPos.set([x,y], id)
      pos = [x, y]
      return true;
    };
    const makeAttack = ([x, y]) => {
      if (!validateMove(x, y, 2)) {return false;}
      if (playersPos.get([x, y])) {
        return true;
        // implement hitting other players
      }
    };
    return { makeMove, makeAttack, pos };
  }

  const getBoard = () => board;

  clear();
  terrain();
  return { getBoard, addPlayer };
};

module.exports = game;

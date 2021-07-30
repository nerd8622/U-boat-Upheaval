const SimplexNoise = require('simplex-noise'),
simplex = new SimplexNoise(Math.random);

const game = (xNum, yNum) => {
  let board;
  let playersPos = Map();
  let players = Map();

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
    let valid = 0;
    let pos;
    while (!valid){
      pos = [Math.random() * xNum, Math.random * yNum];
      if (board[pos[1]][pos[0]] == 0 && !playersPos.get(pos)) {
        valid = 1;
      }
      playersPos.set(pos, id);
      players.set(id, pos);
    }
    const makeMove = (x, y) => {
      if (playersPos.get([x,y])){return false;}
      players.set(id, [x,y]);
      playersPos.delete(pos);
      playersPos.set([x,y], id)
      return true;
    };
    return [ makeMove, pos ];
  }

  const getBoard = () => board;

  clear();
  terrain();
  return { getBoard, addPlayer };
};

module.exports = game;

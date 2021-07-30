const SimplexNoise = require('simplex-noise'),
simplex = new SimplexNoise(Math.random);

const game = (xNum, yNum) => {
  let board;

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

  const makeMove = (sub, x, y) => {
    console.log(x, y);
  };

  const getBoard = () => board;

  clear();
  terrain();
  return { makeMove, getBoard };
};

module.exports = game;

const displayChat = ([name, color, message]) => {
  const listEl = document.querySelector('#messages');
  const newEl = document.createElement('li');
  const nameSp = document.createElement('span');
  nameSp.style.color = color;
  nameSp.style.fontWeight = "bold";
  nameSp.innerHTML = name + ": ";
  newEl.appendChild(nameSp);
  newEl.innerHTML += message;
  listEl.appendChild(newEl);
  listEl.scrollTop = listEl.scrollHeight;
};

const sendChat = (sock) => (e) => {
  e.preventDefault();
  const input = document.querySelector('#message-box');
  const text = input.value;
  input.value = "";
  displayChat(['Me', '#010101', text]);
  sock.emit('chat-message', text);
};

const getClickCoordinates = (element, event) => {
  const { top, left } = element.getBoundingClientRect();
  const { clientX, clientY } = event;
  let scl = element.width / element.getBoundingClientRect().width;
  return {
    x: (clientX - left) * scl,
    y: (clientY - top) * scl
  };
};

/*class Submarine {
  constructor(x, y){
    this.x = x;
    this.y = y;
  }
  move(x, y){
    this.x = x;
    this.y = y;
  }
}*/

const makeGame = (canvas, xCells, yCells) => {
  const ctx = canvas.getContext('2d');
  let board;

  const xSize = Math.floor(canvas.width/xCells);
  const ySize = Math.floor(canvas.height/yCells);

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const highlightCell = (x, y) => {
    ctx.strokeStyle = '#FACE3E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+xSize, y);
    ctx.lineTo(x+xSize, y+ySize);
    ctx.lineTo(x, y+ySize);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const createTiles = (board) => {
    for (let i = 0; i < yCells; i++){
      for (let j = 0; j < xCells; j++){
        if (board[i][j] == 1){ctx.fillStyle = '#C2B280';}
        else {ctx.fillStyle = '#006994';}
        ctx.fillRect(j*xSize, i*ySize, xSize, ySize);
      }
    }
  };

  const createGrid = () => {
    ctx.strokeStyle = '#1F1F1F';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < xCells + 1; i++) {
      ctx.moveTo(i*xSize, 0);
      ctx.lineTo(i*xSize, yCells*ySize);
    }
    for (let i = 0; i < yCells + 1; i++) {
      ctx.moveTo(0, i*ySize);
      ctx.lineTo(xCells*xSize, i*ySize);
    }
    ctx.stroke();
  };

  const createSub = (x, y) => {
    let leng = ySize*.75/2;
    let widt = xSize*.5/2;
    ctx.fillStyle = '#232323';
    ctx.beginPath();
    ctx.ellipse(x*ySize + ySize/2, y*xSize + xSize/2, leng, widt, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  const genSubs = () => {
    subs = [[1,1], [8,6]];
    for (sub of subs){
      createSub(sub[0], sub[1]);
    }
  };

  const setBoard = (bd) => {board = bd;};

  const reset = () => {
    clear();
    createTiles(board);
    createGrid();
    genSubs();
  };

  const getCell = (x, y) => {
    let ax = Math.floor(x/ySize);
    let ay = Math.floor(y/xSize)
    reset();
    highlightCell(ax * ySize, ay * xSize);
    return {x: ax, y: ay};
  };

  return { reset, getCell, setBoard };
};

(() => {
  const sock = io();
  const canvas = document.querySelector('canvas');
  const { reset, getCell, setBoard } = makeGame(canvas, 22, 12);

  const onClick = (event) => {
    const { x, y } = getClickCoordinates(canvas, event);
    console.log(getCell(x, y));
  };

  sock.on('chat-message', displayChat);
  sock.on('board', (board) => {
    setBoard(board);
    reset();
  });

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
  canvas.addEventListener('click', onClick);
})();

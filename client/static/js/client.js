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
  let curPos = [0, 0];
  let subSelected = false;

  const xSize = Math.floor(canvas.width/xCells);
  const ySize = Math.floor(canvas.height/yCells);
  let sleng = ySize*.75/2;
  let swidt = xSize*.5/2;

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const posAvailable = (x, y, range) => {
    return board[y][x] == 0 && !(curPos[0] == x && curPos[1] == y) && Math.abs(curPos[0] - y) <= range && Math.abs(curPos[1] - x) <= range;
  };

  const highlightCell = (x, y, type='full', mode='move') => {
    ctx.strokeStyle = '#FACE3E';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (type == 'full'){
      ctx.moveTo(x, y);
      ctx.lineTo(x+xSize, y);
      ctx.lineTo(x+xSize, y+ySize);
      ctx.lineTo(x, y+ySize);
      ctx.lineTo(x, y);
    } else if (type == 'ship'){
      if (mode == 'attack'){ ctx.strokeStyle = '#FF2424'; }
      ctx.ellipse(x + ySize/2, y + xSize/2, sleng, swidt, 0, 0, 2 * Math.PI);
    }
    ctx.stroke();
  };

  const selectCell = (x, y) => {
    if (subSelected == 1){
      subSelected = false;
      if (posAvailable(x, y, 1)){return [[x, y], 'move'];}
      if (curPos[0] == x && curPos[1] == y) {
        highlightCell(x * ySize, y * xSize, 'ship', 'attack');
        subSelected = 2;
      }
    } else if (subSelected == 2){
      subSelected = false;
      if (posAvailable(x, y, 2)){return [[x, y], 'attack'];}
    } else {
      if (curPos[0] == x && curPos[1] == y) {
        highlightCell(x * ySize, y * xSize, 'ship');
        subSelected = 1;
      } else {highlightCell(x * ySize, y * xSize);}
    }
    return false;
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
    ctx.fillStyle = '#232323';
    ctx.beginPath();
    ctx.ellipse(x*ySize + ySize/2, y*xSize + xSize/2, sleng, swidt, 0, 0, 2 * Math.PI);
    ctx.fill();
  };

  const genSubs = () => {
    subs = [curPos];
    for (sub of subs){
      createSub(sub[0], sub[1]);
    }
  };

  const setBoard = (bd) => {board = bd; reset();};

  const setPos = (pos) => {curPos = pos; reset();};

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
    return selectCell(ax, ay);
  };

  return { reset, getCell, setBoard, setPos };
};

(() => {
  const sock = io();
  const canvas = document.querySelector('canvas');
  const { reset, getCell, setBoard, setPos } = makeGame(canvas, 22, 12);

  const onClick = (event) => {
    const { x, y } = getClickCoordinates(canvas, event);
    const action = getCell(x, y);
    if (action) {
      const [pos, mode] = action;
      if (mode == 'move'){
        sock.emit('player-move', pos);
      } else if (mode == 'attack'){
        sock.emit('player-attack', pos);
      }
    }
  };

  sock.on('chat-message', displayChat);
  sock.on('board', setBoard);
  sock.on('player-sub', setPos);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
  canvas.addEventListener('click', onClick);
})();

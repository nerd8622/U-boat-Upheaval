const displayChat = ([name, color, message], private=false) => {
  const listEl = document.querySelector('#messages');
  const newEl = document.createElement('li');
  const nameSp = document.createElement('span');
  let privately = "";
  if (private) {privately = " (privately)";}
  nameSp.style.color = color;
  nameSp.style.fontWeight = "bold";
  nameSp.innerHTML = name + privately + ": ";
  newEl.appendChild(nameSp);
  newEl.innerHTML += message;
  listEl.appendChild(newEl);
  listEl.scrollTop = listEl.scrollHeight;
};

const addPlayer = ([name, color]) => {
  const dropdown = document.querySelector('#recipient');
  const option = document.createElement('option');
  option.value = option.text = name;
  option.style.color = color;
  dropdown.add(option);
};

const sendChat = (sock) => (e) => {
  e.preventDefault();
  const input = document.querySelector('#message-box');
  const recipient = document.querySelector('#recipient').value;
  const text = input.value;
  input.value = "";
  if (recipient == ""){
    displayChat(['Me', '#010101', text]);
    sock.emit('chat-message', text);
  } else{
    displayChat([`Me (to ${recipient})`, '#010101', text]);
    sock.emit('chat-message-private', [recipient, text]);
  }
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

const makeGame = (canvas, xCells, yCells) => {
  let ctx = canvas.getContext('2d');
  let scale = 1;
  let board, gameState;
  let subSelected = false;

  class Sprite extends Image{
    constructor(xSize, ySize, src) {
      super(xSize, ySize);
      this.src = src;
    }
    draw(pos_x, pos_y){
      if (this.complete){
        ctx.drawImage(this, pos_x, pos_y, this.width, this.height);
      }
      else {
        this.addEventListener("load", (event) => {
          ctx.drawImage(this, pos_x, pos_y, this.width, this.height);
        });
      }
    }
  }

  const xSize = Math.floor(canvas.width/xCells);
  const ySize = Math.floor(canvas.height/yCells);

  let boardmarkings = [];


  const submarine_img = new Sprite(50, 50, '/img/submarine.png');
  const submerged_img = new Sprite(50, 50, '/img/submarine_submerged.png');
  const move_out_img = new Sprite(50, 50, '/img/move_outline.png');
  const attk_out_img = new Sprite(50, 50, '/img/attack_outline.png');

  const water = new Sprite(50,50, '/img/water.png');
  //const water = new Sprite(50, 50, '/img/anbot.png');
  const island_1 = new Sprite(50, 50, '/img/island_1.png');

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const posAvailable = (x, y, range) => {
    return board[y][x] == 0 && !(gameState.pos[0] == x && gameState.pos[1] == y) && Math.abs(gameState.pos[0] - x) <= range && Math.abs(gameState.pos[1] - y) <= range;
  };

  const highlightCell = (x, y, type='full', mode='move') => {
    if (type == 'full'){
      ctx.strokeStyle = '#FACE3E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x+xSize, y);
      ctx.lineTo(x+xSize, y+ySize);
      ctx.lineTo(x, y+ySize);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (type == 'ship'){
      if (mode == 'attack'){attk_out_img.draw(x, y);}
      else {move_out_img.draw(x, y);}
      if (true){
        const xad = x>=880 ? -160-0.8*xSize : 0.8*xSize;
        const yad = y>=430 ? -130-0.4*ySize : 0.4*ySize;
        const xst = (x+xad)|0;
        const yst = (y+yad)|0;
        ctx.fillStyle = '#3B3A38CC';
        ctx.fillRect(xst, yst, 160, 130);
        ctx.fillStyle = '#D3F731C0';
        ctx.fillRect(xst+5, yst+5, 150, 35);
        ctx.fillStyle = '#32BDD9C0';
        ctx.fillRect(xst+5, yst+45, 150, 35);
        ctx.fillStyle = '#FA3A38C0';
        ctx.fillRect(xst+5, yst+85, 150, 35);
        ctx.fillStyle = '#BEC3C4CC';
        ctx.fillText("Move", xst+8, yst+21);
        ctx.fillText("Submerge", xst+8, yst+61);
        ctx.fillText("Attack", xst+8, yst+101);
      }
    }

  };

  const selectCell = (x, y) => {
    if (subSelected == 1){
      subSelected = false;
      if (posAvailable(x, y, 1)){return [[x, y], 'move'];}
      if (gameState.pos[0] == x && gameState.pos[1] == y) {
        highlightCell(x * ySize, y * xSize, 'ship', 'attack');
        subSelected = 2;
      }
    } else if (subSelected == 2){
      subSelected = false;
      if (posAvailable(x, y, 2)){return [[x, y], 'attack'];}
    } else {
      if (gameState.pos[0] == x && gameState.pos[1] == y) {
        highlightCell(x * ySize, y * xSize, 'ship');
        subSelected = 1;
      } else {highlightCell(x * ySize, y * xSize);}
    }
    return false;
  };

  const createTiles = () => {
    for (let i = 0; i < yCells; i++){
      for (let j = 0; j < xCells; j++){
        if (board[i][j] == 1){island_1.draw(j*xSize, i*ySize);}
        else {water.draw(j*xSize, i*ySize);}
      }
    }
  };

  const createGrid = () => {
    ctx.strokeStyle = '#1F1F1F99';
    ctx.fillStyle = '#1F1F1F99';
    ctx.font = '20px serif';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < xCells + 1; i++) {
      ctx.fillText((i+1).toString(), xSize*(i+0.6), ySize*0.8);
      ctx.moveTo(i*xSize, 0);
      ctx.lineTo(i*xSize, yCells*ySize);
    }
    for (let i = 0; i < yCells + 1; i++) {
      ctx.fillText(String.fromCharCode(65+i), xSize*0.6, ySize*(i+0.8));
      ctx.moveTo(0, i*ySize);
      ctx.lineTo(xCells*xSize, i*ySize);
    }
    ctx.stroke();
  };

  const createUI = () => {
    if (true){
    ctx.fillStyle = '#EBEBEB60';
    ctx.fillRect(canvas.width*0.04, canvas.height*0.01, canvas.width/2, canvas.height*0.05);
    ctx.fillRect(canvas.width*0.04, canvas.height*0.07, canvas.width/2, canvas.height*0.05);
    ctx.fillStyle = '#F3FF4D60';
    ctx.fillRect(canvas.width*0.04, canvas.height*0.01, canvas.width/2*(gameState.stats.energy/5), canvas.height*0.05);
    ctx.fillStyle = '#5EFFEF60';
    ctx.fillRect(canvas.width*0.04, canvas.height*0.07, canvas.width/2*(gameState.stats.oxygen/5), canvas.height*0.05);
    }
  };

  const createSub = ([x, y], isMe=false) => {
    submarine_img.draw((x*ySize)|0, (y*xSize)|0);
    if (!isMe) {/* Draw Mask */};
  };

  const genSubs = () => {
    for (sub of gameState.neighbors){createSub(sub[0]);}
    createSub(gameState.pos, true);
  };

  const setBoard = (bd) => {board = bd;};

  const gameUpdate = (g) => {gameState = g; reset();};

  const reset = () => {
    ctx.scale(scale, scale);
    clear();
    createTiles();
    createGrid();
    createUI();
    genSubs();
  };

  const zoom = (e) => {
    let factor = 0.03;
    if (e.deltaY < 0) {factor = -0.03}
    scale = Math.min(5, Math.max(scale + factor, 1));
    reset();
  };

  const getCell = (x, y) => {
    let ax = Math.floor(x/ySize);
    let ay = Math.floor(y/xSize);
    reset();
    return selectCell(ax, ay);
  };

  return { getCell, setBoard, gameUpdate, zoom };
};

(() => {
  const sock = io();
  const canvas = document.querySelector('canvas');
  const { getCell, setBoard, gameUpdate, zoom } = makeGame(canvas, 22, 12);

  const onClick = (e) => {
    const { x, y } = getClickCoordinates(canvas, e);
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

  sock.on('player-join', addPlayer);
  sock.on('chat-message', displayChat);
  sock.on('chat-message-private', (message) => {displayChat(message, true)});
  sock.on('board', setBoard);
  sock.on('game-update', gameUpdate);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
  canvas.addEventListener('click', onClick);
  //canvas.addEventListener('wheel', zoom);
})();

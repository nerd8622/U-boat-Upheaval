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
  let board, gameState, subB;
  let subSelected = false, anim_lock = false;

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
  const move_out_img = new Sprite(50, 50, '/img/move_outline.png');
  const attk_out_img = new Sprite(50, 50, '/img/attack_outline.png');
  const submerged_img = new Sprite(50, 50, '/img/submerged_mask.png');
  const scan_img = new Sprite(50, 50, '/img/scan_mask.png');

  const water = new Sprite(50,50, '/img/water.png');
  const island_1 = new Sprite(50, 50, '/img/island_1.png');

  const attk_cur_img = new Sprite(50, 50, '/img/attack_cursor.png');

  const clear = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const posAvailable = (x, y, range) => {
    return board[y][x] == 0 && !(gameState.pos[0] == x && gameState.pos[1] == y) && Math.abs(gameState.pos[0] - x) <= range && Math.abs(gameState.pos[1] - y) <= range;
  };

  const highlightCell = (x, y, type='full', mode='move', cursor=false) => {
    if (type == 'full'){
      ctx.strokeStyle = '#FACE3EA5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x+xSize, y);
      ctx.lineTo(x+xSize, y+ySize);
      ctx.lineTo(x, y+ySize);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (type == 'ship'){
      if (mode == 'attack'){
        (cursor ? attk_cur_img : attk_out_img).draw(x, y);
      }
      else {move_out_img.draw(x, y);}
    }
  };

  const subMenu = (xh, yh, h=false) => {
    if (true){
      ctx.fillStyle = '#EBEBEB60';
      ctx.fillRect(canvas.width*0.04, canvas.height*0.01, canvas.width/2, canvas.height*0.05);
      ctx.fillRect(canvas.width*0.04, canvas.height*0.07, canvas.width/2, canvas.height*0.05);
      ctx.fillStyle = '#F3FF4D60';
      ctx.fillRect(canvas.width*0.04, canvas.height*0.01, canvas.width/2*(gameState.stats.energy/5), canvas.height*0.05);
      ctx.fillStyle = '#5EFFEF60';
      ctx.fillRect(canvas.width*0.04, canvas.height*0.07, canvas.width/2*(gameState.stats.oxygen/5), canvas.height*0.05);
    }

    const xst = (xh + (xh>=880 ? -160 : 0.8*xSize))|0;
    const yst = (yh + (yh>=430 ? -165 : 0.4*ySize))|0;

    ctx.fillStyle = '#3B3A38CC';
    ctx.fillRect(xst, yst, 160, 165);
    ctx.fillStyle = (h == 1) ? '#997B28C0':'#826B2CC0';
    ctx.fillRect(xst+5, yst+5, 150, 35);
    ctx.fillStyle = (h == 2) ? '#32DB14C0':'#38C41FC0';
    ctx.fillRect(xst+5, yst+45, 150, 35);
    ctx.fillStyle = (h == 3) ? '#32BDD9C0':'#37A6BDC0';
    ctx.fillRect(xst+5, yst+85, 150, 35);
    ctx.fillStyle = (h == 4) ? '#FA3A38C0':'#D93C3BC0';
    ctx.fillRect(xst+5, yst+125, 150, 35);
    ctx.fillStyle = '#BEC3C4';
    ctx.fillText("Move", xst+8, yst+25);
    ctx.fillText("Scan", xst+8, yst+65);
    ctx.fillText(gameState.submerged ? "Surface" : "Submerge", xst+8, yst+105);
    ctx.fillText("Attack", xst+8, yst+145);

    const subMenuButton = (ax, ay, h) => {
      let out = 0;
      if (ax >= xst+5 && ax <= xst+155) {
        if (ay >= yst+5 && ay <= yst+40){out = 1;}
        if (ay >= yst+45 && ay <= yst+80){out = 2;}
        if (ay >= yst+85 && ay <= yst+120){out = 3;}
        if (ay >= yst+125 && ay <= yst+160){out = 4;}
      }
      if (h) {subMenu(xh, yh, out);}
      return out;
    };
    return subMenuButton;
  };

  const selectCell = (ax, ay, hover) => {
    const x = Math.floor(ax/xSize);
    const y = Math.floor(ay/ySize);
    const xh = x * xSize;
    const yh = y * ySize;
    const xm = (gameState.pos[0]*xSize)|0;
    const ym = (gameState.pos[1]*ySize)|0;

    if (subSelected == 1){
      if (hover) {highlightCell(xm, ym, 'ship'); subB(ax, ay, true); return false;}
      subSelected = false;
      let button = subB(ax, ay);
      if (button == 1){
        subSelected = 2;
        highlightCell(xm, ym, 'ship');
      }
      else if (button == 2){
        return [[], 'scan'];
      }
      else if (button == 3){
        return [gameState.submerged, 'submerge'];
      }
      else if (button == 4){
        subSelected = 3;
        highlightCell(xm, ym, 'ship', 'attack');
      }
    }
    else if (subSelected == 2){
      if (hover) {
        if(Math.abs(gameState.pos[0] - x) <= 1 && Math.abs(gameState.pos[1] - y) <= 1){
          highlightCell(xh, yh, 'ship');} return false;
      }
      subSelected = false;
      if (posAvailable(x, y, 1)){return [[x, y], 'move'];}
    } else if (subSelected == 3){
      if (hover) {
        if(Math.abs(gameState.pos[0] - x) <= 2 && Math.abs(gameState.pos[1] - y) <= 2){
          highlightCell(xh, yh, 'ship', 'attack', true);
          highlightCell(xm, ym, 'ship', 'attack');} return false;
      }
      subSelected = false;
      if (posAvailable(x, y, 2)){return [[x, y], 'attack'];}
    } else {
      if (gameState.pos[0] == x && gameState.pos[1] == y && !hover) {
        highlightCell(xm, ym, 'ship');
        subB = subMenu(xh, yh);
        subSelected = 1;
      } else {highlightCell(xh, yh);}
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

  const createSub = ([x, y], isMe=false, mask=0) => {
    x = (x*xSize)|0; y = (y*ySize)|0;
    submarine_img.draw(x, y);
    if (!isMe) {/* Draw Mask */}
    if (mask == 1){scan_img.draw(x, y);}
    else if (mask == 2) {submerged_img.draw(x, y);}
  };

  const genSubs = (anim=false) => {
    for (sub of gameState.scans){createSub(sub[0], true, 1);}
    for (sub of gameState.neighbors){createSub(sub[0]);}
    if (anim[0] == 0){ctx.translate(...anim[1]);}
    if (anim[0] == 1){ctx.translate(xSize*(anim[1]+0.5), ySize*(anim[1]+0.5)); ctx.rotate(anim[2]);}
    createSub(anim ? anim[1] : gameState.pos, true, gameState.submerged ? 2 : 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  const animMove = ([x, y]) => {
    const old = gameState.pos;
    const dx = ((x-old[0]) * xSize)|0, dy = ((y-old[1]) * ySize)|0;
    const stpx = dx ? dx/Math.abs(dx) : 0, stpy = dy ? dy/Math.abs(dy) : 0;
    const theta = Math.atan2(stpy, stpx);
    let trans = [0, 0], tz = 0;
    anm = setInterval(frame, 10);
    anim_lock = true;
    function frame(){
      if (tz < theta){
        reset([1, [1, old], tz]);
        tz += Math.pi/180;
      }
      else if (Math.abs(trans[0]) >= Math.abs(dx) && Math.abs(trans[1]) >= Math.abs(dy)){
        anim_lock = false;
        reset();
        clearInterval(anm);
      }
      else {
        reset([1, [0, [trans, old]]]);
        trans = [trans[0] + stpx, trans[1] + stpy];
      }
    };
  };

  const animAttk = ([x, y], me=false) => {

  };

  const animScan = () => {
    const [x,y] = [gameState.pos[0]*xSize + xSize/2, gameState.pos[1]*xSize + xSize/2];
    let radius = 0;
    anim_lock = true;
    ctx.strokeStyle = '#32DB14C0';
    ctx.lineWidth = 4;
    anm = setInterval(frame, 10);
    function frame(){
      if (radius >= (4*xSize)){
        anim_lock = false;
        reset();
        clearInterval(anm);
      }
      reset([3]);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.stroke();
      radius += 2;
    }
  };

  const setBoard = (bd) => {board = bd;};

  const gameUpdate = ([type, g]) => {
    if (type == 1){animMove(g.pos);}
    else if (type == 2){animAttk(g.hit[1]);}
    else if (type == 3){animScan();}
    gameState = g;
    reset();
  };

  const reset = (atype=false) => {
    if (!anim_lock || atype){
      ctx.scale(scale, scale);
      clear();
      createTiles();
      createGrid();
      genSubs(atype[0] == 1 ? atype[1]: false);
    }
  };

  const zoom = (e) => {
    let factor = 0.03;
    if (e.deltaY < 0) {factor = -0.03}
    scale = Math.min(5, Math.max(scale + factor, 1));
    reset();
  };

  const getCell = (x, y, h=false) => {
    if (!anim_lock){
      reset();
      return selectCell(x, y, h);
    }
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
      } else if (mode == 'scan'){
        sock.emit('player-scan', pos);
      } else if (mode == 'submerge'){
        sock.emit('player-submerge', pos);
      }
    }
  };

  const onMouseMove = (e) => {
    const { x, y } = getClickCoordinates(canvas, e);
    getCell(x, y, true);
  };

  sock.on('player-join', addPlayer);
  sock.on('chat-message', displayChat);
  sock.on('chat-message-private', (message) => {displayChat(message, true)});
  sock.on('board', setBoard);
  sock.on('game-update', gameUpdate);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);
  //canvas.addEventListener('wheel', zoom);
})();

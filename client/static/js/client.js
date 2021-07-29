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

  const xSize = Math.floor(canvas.width/xCells);
  const ySize = Math.floor(canvas.height/yCells);

  const clear = () => {
    ctx.fillStyle = '#4533CA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const createGrid = () => {
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
    let leng = ySize*.75;
    let widt = xSize*.5;
    ctx.fillStyle = '#232323';
    ctx.beginPath();
    ctx.ellipse(x*ySize + leng/2, y*xSize + widt/2, leng, widt, 0, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const genSubs = () => {
    subs = [[1,1], [8,6]];
    for (sub of subs){
      createSub(sub);
    }
  };

  const reset = () => {
    clear();
    createGrid();
    genSubs();
  };

  const getCell = (x, y) => ({
    x: Math.floor(x/ySize),
    y: Math.floor(y/xSize)
  });

  return { reset, getCell };
};

(() => {
  const sock = io();
  const canvas = document.querySelector('canvas');
  const { reset, getCell } = makeGame(canvas, 22, 12);
  reset();

  const onClick = (event) => {
    const { x, y } = getClickCoordinates(canvas, event);
    console.log(getCell(x, y));
  };

  sock.on('chat-message', displayChat);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
  canvas.addEventListener('click', onClick);
})();

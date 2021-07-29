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
  return {
    x: clientX - left,
    y: clientY - top
  };
};

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
      ctx.moveTo(i*ySize, 0);
      ctx.lineTo(i*ySize, yCells*ySize);
    }
    for (let i = 0; i < yCells + 1; i++) {
      ctx.moveTo(0, i*xSize);
      ctx.lineTo(xCells*xSize, i*xSize);
    }
    ctx.stroke();
  };

  const reset = () => {
    clear();
    createGrid();
  };

    return { reset };
};

(() => {
  const sock = io();
  const canvas = document.querySelector('canvas');
  const { reset } = makeGame(canvas, 22, 12);
  reset();

  sock.on('chat-message', displayChat);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
})();

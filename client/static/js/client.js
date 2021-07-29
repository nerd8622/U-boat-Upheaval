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

const draw = (canvas) => {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4533CA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

(() => {
  const sock = io();
  const canvas = document.querySelector('canvas');
  draw(canvas);
  
  sock.on('chat-message', displayChat);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
})();

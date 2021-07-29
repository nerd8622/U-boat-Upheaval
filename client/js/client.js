const displayChat = ([name, color, message]) => {
  const listEl = document.querySelector('#messages');
  const newEl = document.createElement('li');
  const nameSp = document.createElement('span');
  nameSp.style.color = color;
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
  sock.emit('chat-message', text);
};

(() => {
  const sock = io();
  sock.on('chat-message', displayChat);

  document.querySelector('#chat-form').addEventListener('submit', sendChat(sock));
})();

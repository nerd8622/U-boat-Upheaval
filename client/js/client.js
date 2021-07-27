(() => {
  const sock = io();
  sock.on('message', console.log);
})();

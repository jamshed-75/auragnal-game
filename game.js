
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.querySelector('.overlay');
const startBtn = document.getElementById('startBtn');

startBtn.addEventListener('click', () => {
  overlay.style.display = 'none';
  startGame();
});

function startGame() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '40px Arial';
  ctx.fillStyle = 'gold';
  ctx.fillText('Game Started...', canvas.width / 2 - 150, canvas.height / 2);
}

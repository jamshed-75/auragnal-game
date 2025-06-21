const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameStarted = false;

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("startBtn").addEventListener("touchstart", startGame);

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Sample test: draw a circle moving left to right
  const time = Date.now() / 500;
  const x = 100 + Math.sin(time) * 300;

  ctx.fillStyle = "gold";
  ctx.beginPath();
  ctx.arc(x, 200, 30, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(gameLoop);
}
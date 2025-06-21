const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameStarted = false;

const bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";
let bgLoaded = false;
bgImage.onload = () => {
  bgLoaded = true;
};

function startGame() {
  document.getElementById("ui").style.display = "none";
  gameStarted = true;
  requestAnimationFrame(gameLoop);
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("startBtn").addEventListener("touchstart", startGame);

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  if (bgLoaded) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }

  // Temporary test animation (yellow bouncing orb)
  const time = Date.now() / 500;
  const x = 100 + Math.sin(time) * 400;

  ctx.fillStyle = "gold";
  ctx.beginPath();
  ctx.arc(x, 500, 30, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(gameLoop);
}
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const shopBtn = document.getElementById("shopBtn");
const bgMusic = document.getElementById("bgMusic");
const jumpSound = document.getElementById("jumpSound");
const collectSound = document.getElementById("collectSound");
const deathSound = document.getElementById("deathSound");
const startSound = document.getElementById("startSound");

let gameRunning = false;
let player = {
  x: 100,
  y: 630,
  width: 60,
  height: 80,
  color: "#FFD700",
  velocityY: 0,
  jumpForce: 16,
  gravity: 1,
  grounded: false,
};

function drawPlayer() {
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function updatePlayer() {
  player.velocityY += player.gravity;
  player.y += player.velocityY;

  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.velocityY = 0;
    player.grounded = true;
  } else {
    player.grounded = false;
  }
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updatePlayer();
  drawPlayer();

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function startGame() {
  startSound.play();
  bgMusic.volume = 0.5;
  bgMusic.play();
  gameRunning = true;
  gameLoop();
}

function jump() {
  if (player.grounded) {
    player.velocityY = -player.jumpForce;
    player.grounded = false;
    jumpSound.play();
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") jump();
});

window.addEventListener("touchstart", jump);

startBtn.addEventListener("click", startGame);

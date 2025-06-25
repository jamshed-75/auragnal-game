const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");
const pauseBtn = document.getElementById("pauseBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const mobileUp = document.getElementById("mobile-up");
const mobileLeft = document.getElementById("mobile-left");
const mobileRight = document.getElementById("mobile-right");
const mobileControls = document.getElementById("mobile-controls");
const gameOverlay = document.getElementById("game-overlay");
const gameScoreDisplay = document.getElementById("gameScoreDisplay");

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let isMuted = false;
let isPaused = false;
let gameStarted = false;
let gameOver = false;
let frameCount = 0;
let gameSpeed = 4;
let score = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;
let fallingObstacles = false;

// Load assets
const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png";
let bgX = 0;

// Sounds
const sounds = {
  jump: new Audio("assets/sound/jump.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  death: new Audio("assets/sound/death.wav"),
  music: new Audio("assets/sound/game.wav"),
};
sounds.music.loop = true;

const cartFrames = ["cart_empty.png", "cart_partial.png", "cart_full.png", "cart_broken.png"].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

// Player class
class Player {
  constructor() {
    this.scale = 0.09;
    this.x = 100;
    this.y = CANVAS_HEIGHT - 380 * this.scale - 40;
    this.dy = 0;
    this.width = 405 * this.scale;
    this.height = 380 * this.scale;
    this.jumpPower = -24;
    this.grounded = true;
    this.isDead = false;
    this.state = 0;
  }
  update() {
    if (!this.isDead && !isPaused) {
      this.dy += 1.1;
      this.y += this.dy;
      if (this.y + this.height >= CANVAS_HEIGHT - 40) {
        this.y = CANVAS_HEIGHT - this.height - 40;
        this.dy = 0;
        this.grounded = true;
      } else {
        this.grounded = false;
      }
    }
  }
  draw() {
    const img = cartFrames[this.state];
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  }
  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
      if (!isMuted) sounds.jump.play();
    }
  }
  moveLeft() {
    if (!this.isDead) this.x = Math.max(0, this.x - 10);
  }
  moveRight() {
    if (!this.isDead) this.x = Math.min(CANVAS_WIDTH - this.width, this.x + 10);
  }
  die() {
    this.isDead = true;
    this.state = 3;
    if (!isMuted) sounds.death.play();
  }
}

class GameObject {
  constructor(imgSrc, size = 48, falling = false) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.size = size;
    this.x = CANVAS_WIDTH + Math.random() * 300 + 200;
    this.y = falling ? -size : CANVAS_HEIGHT - size - 40;
    this.falling = falling;
    this.marked = false;
  }
  update() {
    if (this.falling) {
      this.y += gameSpeed;
    } else {
      this.x -= gameSpeed;
    }
    if (this.x + this.size < 0 || this.y > CANVAS_HEIGHT) this.marked = true;
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }
  collides(player) {
    return !(
      player.x > this.x + this.size ||
      player.x + player.width < this.x ||
      player.y > this.y + this.size ||
      player.y + player.height < this.y
    );
  }
}

// Init game objects
const player = new Player();
let collectibles = [];
let obstacles = [];

const collectibleImgs = [
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earing.png",
];
const obstacleImgs = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

// Spawn helpers
function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 48));
}
function spawnObstacle(falling = false) {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 48, falling));
}
function spawnFallingObstacles() {
  fallingObstacles = true;
  const interval = setInterval(() => {
    spawnObstacle(true);
  }, 300);
  setTimeout(() => {
    clearInterval(interval);
    fallingObstacles = false;
  }, 3000);
}

// Drawing
function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -bgImage.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, bgImage.width, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, CANVAS_HEIGHT);
}
function drawScore() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);
}
function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#FFFAFA";
  ctx.font = "30px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  tryAgainBtn.classList.remove("hidden");
  letsShopBtn.classList.remove("hidden");
}

// Reset game
function resetGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 4;
  frameCount = 0;
  player.x = 100;
  player.state = 0;
  player.dy = 0;
  player.y = CANVAS_HEIGHT - player.height - 40;
  player.isDead = false;
  obstacles = [];
  collectibles = [];
  tryAgainBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  sounds.music.currentTime = 0;
  if (!isMuted) sounds.music.play();
  requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop() {
  if (gameOver || isPaused) return;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();
  player.update();
  player.draw();

  if (frameCount % 120 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    c.update();
    c.draw();
    if (c.collides(player)) {
      score += 10;
      player.state = Math.min(2, player.state + 1);
      collectibles.splice(i, 1);
      if (!isMuted) sounds.collect.play();
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.update();
    o.draw();
    if (o.collides(player) && !player.isDead) {
      player.die();
      gameOver = true;
      highScore = Math.max(highScore, score);
      localStorage.setItem("auragnalHighScore", highScore);
      setTimeout(() => {
        drawGameOver();
      }, 500);
    }
  }

  drawScore();
  frameCount++;

  if (score !== 0 && score % 50 === 0 && !fallingObstacles) {
    gameSpeed += 0.1;
    spawnFallingObstacles();
  }

  requestAnimationFrame(gameLoop);
}

// Button events
startBtn.onclick = () => {
  gameStarted = true;
  startBtn.style.display = "none";
  letsShopBtn.classList.add("hidden");
  resetGame();
};

tryAgainBtn.onclick = () => {
  resetGame();
};

letsShopBtn.onclick = () => {
  window.location.href = "https://auragnal.com";
};

muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  sounds.music.volume = isMuted ? 0 : 1;
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️" : "⏸️";
  if (!isPaused) requestAnimationFrame(gameLoop);
};

// Controls
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "ArrowUp" || e.code === "Space") player.jump();
  if (e.code === "Enter" && gameOver) resetGame();
});
window.addEventListener("keyup", (e) => {
  keys[e.code] = false;
});

function checkKeysHeld() {
  if (keys["ArrowLeft"]) player.moveLeft();
  if (keys["ArrowRight"]) player.moveRight();
  requestAnimationFrame(checkKeysHeld);
}
checkKeysHeld();

// Mobile multi-touch
mobileUp.addEventListener("touchstart", e => {
  e.preventDefault();
  player.jump();
});
mobileLeft.addEventListener("touchstart", e => {
  e.preventDefault();
  player.moveLeft();
});
mobileRight.addEventListener("touchstart", e => {
  e.preventDefault();
  player.moveRight();
});

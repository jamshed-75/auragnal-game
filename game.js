// game.js (vPolished with collision, speed, reset, falling fixes)

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
const gameScoreDisplay = document.getElementById("game-score");

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let isMuted = false;
let isPaused = false;
let gameStarted = false;
let gameOver = false;
let frameCount = 0;
let gameSpeed = 5.5; // ⬅️ Slightly faster default
let score = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;
let fallingObstacles = false;

// Background
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

// Cart Frames
const cartFrames = ["cart_empty.png", "cart_partial.png", "cart_full.png", "cart_broken.png"].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

// GameObject
class GameObject {
  constructor(imgSrc, size = 56, falling = false) {
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
    const buffer = 10;
    return !(
      player.x + player.width - buffer < this.x ||
      player.x + buffer > this.x + this.size ||
      player.y + player.height - buffer < this.y ||
      player.y + buffer > this.y + this.size
    );
  }
}

// Player
class Player {
  constructor() {
    this.scale = 0.09; // ✅ Your manual tweak
    this.x = 100;
    this.y = CANVAS_HEIGHT - 380 * this.scale - 40;
    this.dy = 0;
    this.width = 405 * this.scale;
    this.height = 380 * this.scale;
    this.jumpPower = -24; // ✅ Your manual tweak
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
    this.width = img.width * this.scale;
    this.height = img.height * this.scale;
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

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 48));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 48));
}

function spawnFallingObstacles() {
  fallingObstacles = true;
  const interval = setInterval(() => {
    const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
    obstacles.push(new GameObject(img, 48, true));
  }, 300);
  setTimeout(() => {
    clearInterval(interval);
    fallingObstacles = false;
  }, 3000);
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -bgImage.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, bgImage.width, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, CANVAS_HEIGHT);
}

function drawScore() {
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Cinzel Decorative";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#FFFAFA";
  ctx.font = "30px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  setTimeout(() => {
    tryAgainBtn.classList.remove("hidden");
    letsShopBtn.classList.remove("hidden");
    mobileControls.classList.add("hidden");
  }, 800);
}

function resetGame() {
  gameOver = false;
  gameStarted = true;
  score = 0;
  gameSpeed = 5.5;
  frameCount = 0;
  collectibles = [];
  obstacles = [];
  player.isDead = false;
  player.state = 0;
  player.y = CANVAS_HEIGHT - player.height - 40;
  player.x = 100;
  tryAgainBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  gameScoreDisplay.style.visibility = "visible";
  mobileControls.classList.remove("hidden");
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver || isPaused) {
    if (gameOver) drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();
  player.update();
  player.draw();

  if (frameCount % 140 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      score += 10;
      player.state = Math.min(2, player.state + 1);
      collectibles.splice(i, 1);
      if (!isMuted) sounds.collect.play();
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player)) {
      player.die();
      gameOver = true;
      highScore = Math.max(highScore, score);
      localStorage.setItem("auragnalHighScore", highScore);
    }
  });

  drawScore();
  frameCount++;

  if (score % 50 === 0 && score !== 0 && frameCount % 5 === 0 && !fallingObstacles) {
    gameSpeed += 0.1;
    spawnFallingObstacles();
  }

  requestAnimationFrame(gameLoop);
}

// Buttons
startBtn.onclick = () => {
  startBtn.style.display = "none";
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  gameScoreDisplay.style.visibility = "visible";
  mobileControls.classList.remove("hidden");
  if (!isMuted) sounds.music.play();
  resetGame();
};

tryAgainBtn.onclick = () => {
  startBtn.style.display = "none";
  letsShopBtn.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  if (!isMuted) sounds.music.play();
  resetGame();
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️" : "⏸️";
  if (!isPaused) requestAnimationFrame(gameLoop);
};

muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  sounds.music.volume = isMuted ? 0 : 1;
};

letsShopBtn.onclick = () => window.location.href = "https://auragnal.com";

mobileUp.onclick = () => player.jump();
mobileLeft.onclick = () => player.moveLeft();
mobileRight.onclick = () => player.moveRight();

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "Space", "KeyW"].includes(e.code)) player.jump();
  if (["ArrowLeft", "KeyA"].includes(e.code)) player.moveLeft();
  if (["ArrowRight", "KeyD"].includes(e.code)) player.moveRight();
  if (e.code === "Enter" && gameOver) tryAgainBtn.click();
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const mobileControls = document.getElementById("mobile-controls");
const btnLeft = document.getElementById("mobile-left");
const btnRight = document.getElementById("mobile-right");
const btnUp = document.getElementById("mobile-up");

let isMuted = false;
let gameOver = false;
let frameCount = 0;
let gameSpeed = 4;
let score = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png";
let bgX = 0;

// Cart Frames
const cartFrames = ["cart_empty.png", "cart_partial.png", "cart_full.png", "cart_broken.png"].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

class Player {
  constructor() {
    this.scale = 0.13;
    this.x = 100;
    this.y = canvas.height - 380 * this.scale - 40;
    this.dy = 0;
    this.dx = 0;
    this.jumpPower = -18;
    this.grounded = true;
    this.isDead = false;
    this.state = 0;
  }

  update() {
    if (this.isDead) return;
    this.dy += 1;
    this.y += this.dy;
    this.x += this.dx;

    const groundY = canvas.height - 380 * this.scale - 40;
    if (this.y >= groundY) {
      this.y = groundY;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    // Bounds
    this.x = Math.max(0, Math.min(this.x, canvas.width - 405 * this.scale));
  }

  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
    }
  }

  draw() {
    const img = cartFrames[this.state];
    const width = 405 * this.scale;
    const height = 380 * this.scale;
    ctx.drawImage(img, this.x, this.y, width, height);
  }

  die() {
    this.isDead = true;
    this.state = 3;
  }
}

class GameObject {
  constructor(imgSrc, size = 48) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.size = size;
    this.x = canvas.width + Math.random() * 300 + 200;
    this.y = canvas.height - size - 40;
    this.marked = false;
  }

  update() {
    this.x -= gameSpeed;
    if (this.x + this.size < 0) this.marked = true;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }

  collides(player) {
    return !(
      player.x > this.x + this.size ||
      player.x + 405 * player.scale < this.x ||
      player.y > this.y + this.size ||
      player.y + 380 * player.scale < this.y
    );
  }
}

const player = new Player();
let collectibles = [];
let obstacles = [];

const collectibleImgs = [
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earing.png"
];

const obstacleImgs = [
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
  "assets/images/obstacle_cart.png"
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img));
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -bgImage.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, bgImage.width, canvas.height);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, canvas.height);
}

function drawScore() {
  ctx.fillStyle = "#fff";
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "30px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  tryAgainBtn.classList.remove("hidden");
}

function resetGame() {
  gameOver = false;
  gameSpeed = 4;
  score = 0;
  frameCount = 0;
  collectibles = [];
  obstacles = [];
  player.isDead = false;
  player.state = 0;
  player.x = 100;
  player.y = canvas.height - 380 * player.scale - 40;
  tryAgainBtn.classList.add("hidden");
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    }
  });

  obstacles.forEach((o) => {
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
  requestAnimationFrame(gameLoop);
}

// Keyboard Movement
window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "Space", "KeyW"].includes(e.code)) player.jump();
  if (["ArrowLeft", "KeyA"].includes(e.code)) player.dx = -5;
  if (["ArrowRight", "KeyD"].includes(e.code)) player.dx = 5;
});
window.addEventListener("keyup", (e) => {
  if (["ArrowLeft", "KeyA", "ArrowRight", "KeyD"].includes(e.code)) player.dx = 0;
});

// Mobile Movement
btnUp.onclick = () => player.jump();
btnLeft.onpointerdown = () => player.dx = -5;
btnRight.onpointerdown = () => player.dx = 5;
btnLeft.onpointerup = btnRight.onpointerup = () => player.dx = 0;

// Game Start / Reset
startBtn.onclick = () => {
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  muteBtn.style.display = "none";
  mobileControls.classList.remove("hidden");
  resetGame();
};
tryAgainBtn.onclick = () => {
  startBtn.style.display = "inline-block";
  letsShopBtn.style.display = "inline-block";
  muteBtn.style.display = "inline-block";
  mobileControls.classList.add("hidden");
  resetGame();
};
letsShopBtn.onclick = () => window.location.href = "https://auragnal.com";
muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

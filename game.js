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

const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png";
let bgX = 0;

const sounds = {
  jump: new Audio("assets/sound/jump.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  death: new Audio("assets/sound/death.wav"),
  music: new Audio("assets/sound/game.wav")
};
sounds.music.loop = true;

const cartFrames = ["cart_empty.png", "cart_partial.png", "cart_full.png", "cart_broken.png"].map(function(name) {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

class Player {
  constructor() {
    this.scale = 0.18; // 🛠 Reduced size to ~1.5x collectibles
    this.x = 100;
    this.y = CANVAS_HEIGHT - 96 * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -20;
    this.grounded = true;
    this.isDead = false;
    this.state = 0;
  }
  update() {
    this.dy += 1.1;
    this.y += this.dy;
    if (this.y + 96 * this.scale >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - 96 * this.scale - 40;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }
  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
      if (!isMuted) sounds.jump.play();
    }
  }
  draw() {
    const img = cartFrames[this.state];
    if (!img.complete) return;
    const width = img.width * this.scale;
    const height = img.height * this.scale;
    ctx.drawImage(img, this.x, this.y, width, height);
  }
  die() {
    this.isDead = true;
    this.state = 3;
    if (!isMuted) sounds.death.play();
  }
  move(dir) {
    if (dir === "left") this.x -= 5;
    else if (dir === "right") this.x += 5;
    this.x = Math.max(0, Math.min(this.x, CANVAS_WIDTH - 96 * this.scale));
  }
}

class GameObject {
  constructor(imgSrc, size = 48, fall = false) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.size = size;
    this.x = CANVAS_WIDTH + Math.random() * 300 + 200;
    this.y = fall ? -size : CANVAS_HEIGHT - size - 40;
    this.fall = fall;
    this.marked = false;
  }
  update() {
    if (this.fall) {
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
      player.x + 96 * player.scale < this.x ||
      player.y > this.y + this.size ||
      player.y + 96 * player.scale < this.y
    );
  }
}

const player = new Player();
let collectibles = [];
let obstacles = [];
let fallingObstacles = [];
let dropObstaclesActive = false;

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

function spawnFallingObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  fallingObstacles.push(new GameObject(img, 48, true));
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -bgImage.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, bgImage.width, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, CANVAS_HEIGHT);
}

function drawIntroOverlay() {
  if (!gameStarted) {
    ctx.fillStyle = "#FFFAFA";
    ctx.font = "24px Cinzel Decorative";
    ctx.textAlign = "center";
    ctx.shadowColor = "black";
    ctx.shadowBlur = 6;
    ctx.fillText("Welcome to AURAGNAL Mystery Shopper", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.font = "18px Cinzel Decorative";
    ctx.fillText("Collect, Dodge, Survive in Style.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
}

function drawScore() {
  ctx.fillStyle = "#FFFAFA";
  ctx.font = "20px Cinzel Decorative";
  ctx.textAlign = "left";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#FFFAFA";
  ctx.font = "26px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  tryAgainBtn.style.display = "block";
}

function resetGame() {
  gameOver = false;
  isPaused = false;
  gameSpeed = 4;
  score = 0;
  collectibles = [];
  obstacles = [];
  fallingObstacles = [];
  player.isDead = false;
  player.state = 0;
  player.y = CANVAS_HEIGHT - 96 * player.scale - 40;
  tryAgainBtn.style.display = "none";
  mobileControls.classList.remove("hidden");
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver || isPaused) return;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();
  drawIntroOverlay();
  player.update();
  player.draw();

  if (frameCount % 140 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();
  if (dropObstaclesActive && frameCount % 20 === 0) spawnFallingObstacle();

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

  [...obstacles, ...fallingObstacles].forEach((o, i, arr) => {
    o.update();
    o.draw();
    if (o.collides(player)) {
      player.die();
      gameOver = true;
      highScore = Math.max(highScore, score);
      localStorage.setItem("auragnalHighScore", highScore);
      setTimeout(drawGameOver, 600);
    }
  });

  drawScore();

  if (score % 50 === 0 && score !== 0 && frameCount % 10 === 0) {
    gameSpeed += 0.1;
    if (!dropObstaclesActive) {
      dropObstaclesActive = true;
      setTimeout(() => (dropObstaclesActive = false), 3000);
    }
  }
  frameCount++;
  requestAnimationFrame(gameLoop);
}

startBtn.onclick = () => {
  gameStarted = true;
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  mobileControls.classList.remove("hidden");
  if (!isMuted) sounds.music.play();
  resetGame();
};

tryAgainBtn.onclick = () => {
  tryAgainBtn.style.display = "none";
  mobileControls.classList.remove("hidden");
  resetGame();
};

letsShopBtn.onclick = () => {
  window.location.href = "https://auragnal.com";
};

muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.music.pause();
  else if (gameStarted) sounds.music.play();
};

pauseBtn.onclick = () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "▶️" : "⏸️";
  if (!isPaused) requestAnimationFrame(gameLoop);
};

window.addEventListener("keydown", (e) => {
  if (e.code === "ArrowUp" || e.code === "KeyW") player.jump();
  if (e.code === "ArrowLeft" || e.code === "KeyA") player.move("left");
  if (e.code === "ArrowRight" || e.code === "KeyD") player.move("right");
});

mobileUp.onmousedown = () => player.jump();
mobileLeft.onmousedown = () => player.move("left");
mobileRight.onmousedown = () => player.move("right");

mobileUp.ontouchstart = (e) => { e.preventDefault(); player.jump(); };
mobileLeft.ontouchstart = (e) => { e.preventDefault(); player.move("left"); };
mobileRight.ontouchstart = (e) => { e.preventDefault(); player.move("right"); };

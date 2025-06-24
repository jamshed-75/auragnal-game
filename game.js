const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = 960;
canvas.height = 540;

const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");
const jumpBtn = document.getElementById("jumpBtn");
const stopBtn = document.getElementById("stopBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");

let isMuted = false;
let gameStarted = false;
let gameOver = false;
let frameCount = 0;
let gameSpeed = 4;
let score = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;
let playerStopped = false;

// Load sounds
const sounds = {
  jump: new Audio("assets/sound/jump.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  death: new Audio("assets/sound/death.wav"),
  game: new Audio("assets/sound/game.wav"),
};

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png"; // assumed 6120x1440
let bgX = 0;

// Cart Frames
const cartFrames = [
  "cart_empty.png",
  "cart_partial.png",
  "cart_full.png",
  "cart_broken.png"
].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

// Player
class Player {
  constructor() {
    this.scale = 0.2; // Tiny cart now visible
    this.x = 100;
    this.y = canvas.height - 96 * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -20;
    this.grounded = true;
    this.isDead = false;
    this.state = 0;
  }

  update() {
    if (playerStopped || this.isDead) return;
    this.dy += 1;
    this.y += this.dy;

    const groundY = canvas.height - 96 * this.scale - 40;
    if (this.y >= groundY) {
      this.y = groundY;
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
}

// Obstacle / Collectible Class
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
      player.x + 96 * player.scale < this.x ||
      player.y > this.y + this.size ||
      player.y + 96 * player.scale < this.y
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
  ctx.fillStyle = "#ffffff";
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
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
  playerStopped = false;
  player.isDead = false;
  player.state = 0;
  player.y = canvas.height - 96 * player.scale - 40;
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

  if (!playerStopped) {
    if (frameCount % 140 === 0) spawnCollectible();
    if (frameCount % 220 === 0) spawnObstacle();
  }

  player.update();
  player.draw();

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
  if (score % 50 === 0 && frameCount % 10 === 0) {
    gameSpeed += 0.1;
  }

  requestAnimationFrame(gameLoop);
}

// Events
startBtn.onclick = () => {
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  jumpBtn.style.display = "inline-block";
  stopBtn.style.display = "inline-block";
  if (!isMuted) {
    sounds.game.loop = true;
    sounds.game.play();
  }
  resetGame();
};

tryAgainBtn.onclick = () => resetGame();

letsShopBtn.onclick = () => {
  window.location.href = "https://auragnal.com";
};

muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.game.pause();
  else if (!gameOver) sounds.game.play();
};

jumpBtn.onclick = () => player.jump();
stopBtn.onclick = () => playerStopped = !playerStopped;

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "KeyW", "Space"].includes(e.code)) player.jump();
  if (["ArrowDown", "KeyS"].includes(e.code)) playerStopped = true;
});

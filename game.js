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

// Load sounds
const sounds = {
  jump: new Audio("assets/sound/jump.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  death: new Audio("assets/sound/death.wav"),
};

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png";
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
    this.scale = 1; // Slightly larger cart now
    this.x = 100;
    this.y = canvas.height - 96 - 40;
    this.dy = 0;
    this.jumpPower = -25;
    this.grounded = true;
    this.isDead = false;
    this.state = 0;
  }

  update() {
    this.dy += 1; // gravity
    this.y += this.dy;

    if (this.y + 96 >= canvas.height - 40) {
      this.y = canvas.height - 96 - 40;
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

// Game Object (Obstacles & Collectibles)
class GameObject {
  constructor(imgSrc, size = 56) {
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

// Variables
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
  collectibles.push(new GameObject(img, 48));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 48));
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -bgImage.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, bgImage.width, canvas.height);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, canvas.height);
}

function drawScore() {
  ctx.fillStyle = "#588749";
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#588749";
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
  collectibles = [];
  obstacles = [];
  player.isDead = false;
  player.state = 0;
  player.y = canvas.height - 96 - 40;
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

  // Draw in correct order
  obstacles.forEach(o => { o.update(); o.draw(); });
  collectibles.forEach(c => { c.update(); c.draw(); });

  player.update();
  player.draw();

  collectibles.forEach((c, i) => {
    if (c.collides(player)) {
      score += 10;
      player.state = Math.min(2, player.state + 1);
      collectibles.splice(i, 1);
      if (!isMuted) sounds.collect.play();
    }
  });

  obstacles.forEach(o => {
    if (o.collides(player)) {
      player.die();
      gameOver = true;
      highScore = Math.max(highScore, score);
      localStorage.setItem("auragnalHighScore", highScore);
    }
  });

  drawScore();
  frameCount++;
  if (score % 50 === 0 && score !== 0 && frameCount % 10 === 0) {
    gameSpeed += 0.1;
  }

  requestAnimationFrame(gameLoop);
}

// Controls
startBtn.onclick = () => {
  gameStarted = true;
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  jumpBtn.style.display = "inline-block";
  stopBtn.style.display = "inline-block";
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
};

jumpBtn.onclick = () => {
  player.jump();
};

window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "Space", "KeyW"].includes(e.code)) player.jump();
});

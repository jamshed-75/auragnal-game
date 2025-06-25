const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const letsShopBtn = document.getElementById("lets-shop");
const mobileControls = document.getElementById("mobile-controls");
const mobileLeft = document.getElementById("mobile-left");
const mobileRight = document.getElementById("mobile-right");
const mobileUp = document.getElementById("mobile-up");
const gameOverlay = document.getElementById("gameOverlay");
const gameScoreDisplay = document.querySelector(".scoreDisplay");
const muteBtn = document.getElementById("muteBtn");
const pauseBtn = document.getElementById("pauseBtn");

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let isMuted = false;
let isPaused = false;
let gameStarted = false;
let gameOver = false;
let frameCount = 0;
let score = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;
let gameSpeed = 4;
let fallingObstacles = false;

const sounds = {
  jump: new Audio("assets/sound/jump.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  death: new Audio("assets/sound/death.wav"),
  music: new Audio("assets/sound/game.wav"),
};
sounds.music.loop = true;

const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png";
let bgX = 0;

const cartFrames = [
  "cart_empty.png",
  "cart_partial.png",
  "cart_full.png",
  "cart_broken.png",
].map(file => {
  const img = new Image();
  img.src = `assets/cart/${file}`;
  return img;
});

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
    if (!img.complete) return;
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

class GameObject {
  constructor(imgSrc, size = 56, falling = false) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.size = size;
    this.falling = falling;
    this.x = CANVAS_WIDTH + Math.random() * 300 + 200;
    this.y = falling ? -size : CANVAS_HEIGHT - size - 40;
    this.marked = false;
  }

  update() {
    if (this.falling) {
      this.y += gameSpeed;
    } else {
      this.x -= gameSpeed;
    }

    if (this.x + this.size < 0 || this.y > CANVAS_HEIGHT) {
      this.marked = true;
    }
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }

  collides(player) {
    return !(
      player.x + player.width - 20 < this.x ||
      player.x + 20 > this.x + this.size ||
      player.y + player.height - 10 < this.y ||
      player.y + 10 > this.y + this.size
    );
  }
}

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

let player;
let collectibles = [];
let obstacles = [];

function resetGame() {
  player = new Player();
  collectibles = [];
  obstacles = [];
  gameSpeed = 4;
  fallingObstacles = false;
  frameCount = 0;
  score = 0;
  gameOver = false;
  gameStarted = true;

  gameOverlay.classList.add("hidden");
  tryAgainBtn.classList.add("hidden");
  startBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";

  requestAnimationFrame(gameLoop);
}

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
  gameScoreDisplay.innerHTML = `Score: ${score} <br> High Score: ${highScore}`;
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#FFFAFA";
  ctx.font = "26px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  setTimeout(() => {
    tryAgainBtn.classList.remove("hidden");
    letsShopBtn.classList.remove("hidden");
    mobileControls.classList.add("hidden");
  }, 800);
}

function gameLoop() {
  if (isPaused || gameOver) {
    if (gameOver) drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();
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

  if (frameCount % 140 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  if (score > 0 && score % 50 === 0 && frameCount % 5 === 0 && !fallingObstacles) {
    gameSpeed += 0.25;
    spawnFallingObstacles();
  }

  requestAnimationFrame(gameLoop);
}

// Button Events
startBtn.onclick = () => {
  if (!isMuted) sounds.music.play();
  resetGame();
};

tryAgainBtn.onclick = () => {
  tryAgainBtn.disabled = true;
  if (!isMuted) sounds.music.play();
  setTimeout(() => {
    resetGame();
    tryAgainBtn.disabled = false;
  }, 200);
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

// Keyboard Controls
const keysPressed = {};
window.addEventListener("keydown", e => {
  keysPressed[e.code] = true;
  if (["ArrowUp", "Space", "KeyW"].includes(e.code)) player.jump();
  if (keysPressed["ArrowRight"] || keysPressed["KeyD"]) player.moveRight();
  if (keysPressed["ArrowLeft"] || keysPressed["KeyA"]) player.moveLeft();
  if (e.code === "Enter" && gameOver) tryAgainBtn.click();
});
window.addEventListener("keyup", e => {
  keysPressed[e.code] = false;
});

// Touch Controls
mobileUp.ontouchstart = e => {
  e.preventDefault();
  player.jump();
};
mobileLeft.ontouchstart = e => {
  e.preventDefault();
  player.moveLeft();
};
mobileRight.ontouchstart = e => {
  e.preventDefault();
  player.moveRight();
};

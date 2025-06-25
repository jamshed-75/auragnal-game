const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 960;
canvas.height = 540;

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("auragnalHighScore")) || 0;
let gameSpeed = 6;
let gravity = 1.2;
let objects = [];
let collectibles = [];
let fallingObjects = [];
let keys = {};
let spawnTimer = 0;
let fallTimer = 0;
let audioStarted = false;
let tryAgainCooldown = false;

// DOM Elements
const gameOverlay = document.getElementById("gameOverlay");
const startBtn = document.getElementById("startBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const letsShopBtn = document.getElementById("letsShopBtn");
const gameScoreDisplay = document.getElementById("gameScoreDisplay");
const mobileControls = document.querySelector(".mobile-controls");
const desktopInstructions = document.getElementById("desktop-instructions");

// Audio
const bgMusic = new Audio("assets/audio/music.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;

const muteBtn = document.getElementById("muteBtn");
let isMuted = false;
muteBtn.onclick = () => {
  isMuted = !isMuted;
  bgMusic.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

document.getElementById("pauseBtn").onclick = () => {
  bgMusic.pause();
  gameStarted = false;
};

// Sprites
const playerImg = new Image();
playerImg.src = "assets/images/cart.png";

const brokenCartImg = new Image();
brokenCartImg.src = "assets/images/cart_broken.png";

const obstacleImg = new Image();
obstacleImg.src = "assets/images/obstacle.png";

const collectibleImg = new Image();
collectibleImg.src = "assets/images/collectible.png";

const hangerImg = new Image();
hangerImg.src = "assets/images/object_hanger.png";

// Player
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

  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
      this.grounded = false;
    }
  }

  update() {
    if (!this.grounded) this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.height >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - 40 - this.height;
      this.dy = 0;
      this.grounded = true;
    }
  }

  draw() {
    if (this.isDead) {
      ctx.drawImage(brokenCartImg, this.x, this.y, this.width, this.height);
    } else {
      ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }
  }
}

const player = new Player();

// Object
class GameObject {
  constructor(image, yOffset = 0) {
    this.image = image;
    this.width = 80;
    this.height = 80;
    this.x = CANVAS_WIDTH + Math.random() * 300;
    this.y = CANVAS_HEIGHT - this.height - 40 - yOffset;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
}

// Controls
function handleKeyDown(e) {
  keys[e.key] = true;
  if (e.key === " " || e.key === "ArrowUp") player.jump();
  if (e.key === "Enter" && gameOver) tryAgainBtn.click();
}

function handleKeyUp(e) {
  keys[e.key] = false;
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);

// Mobile controls
document.getElementById("leftBtn").addEventListener("touchstart", () => (player.x -= 10));
document.getElementById("rightBtn").addEventListener("touchstart", () => (player.x += 10));
document.getElementById("upBtn").addEventListener("touchstart", () => player.jump());

// Reset Game
function resetGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 6;
  objects = [];
  collectibles = [];
  fallingObjects = [];
  player.isDead = false;
  player.x = 100;
  player.y = CANVAS_HEIGHT - 380 * player.scale - 40;
  player.dy = 0;
  player.grounded = true;
  gameOverlay.classList.add("hidden");
  tryAgainBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  spawnTimer = 0;
  fallTimer = 0;
  animate();
}

// Collision
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// Game Loop
function animate() {
  if (!gameStarted || gameOver) return;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Update player
  player.update();
  player.draw();

  // Spawn
  spawnTimer++;
  if (spawnTimer % 90 === 0) {
    objects.push(new GameObject(obstacleImg));
    collectibles.push(new GameObject(collectibleImg, 100));
  }

  if (score >= 50) {
    fallTimer++;
    if (fallTimer % 120 === 0) {
      fallingObjects.push(new GameObject(hangerImg, -300));
    }
    gameSpeed = 7;
  }

  // Objects
  objects.forEach((obj, i) => {
    obj.update();
    obj.draw();
    if (isColliding(player, obj) && !player.isDead) {
      gameOver = true;
      player.isDead = true;
      setTimeout(() => {
        tryAgainBtn.classList.remove("hidden");
        letsShopBtn.classList.remove("hidden");
      }, 600);
    }
    if (obj.x + obj.width < 0) objects.splice(i, 1);
  });

  // Collectibles
  collectibles.forEach((item, i) => {
    item.update();
    item.draw();
    if (isColliding(player, item)) {
      score += 10;
      collectibles.splice(i, 1);
    }
  });

  // Falling Objects
  fallingObjects.forEach((fo, i) => {
    fo.y += 5;
    fo.draw();
    if (isColliding(player, fo) && !player.isDead) {
      gameOver = true;
      player.isDead = true;
      setTimeout(() => {
        tryAgainBtn.classList.remove("hidden");
        letsShopBtn.classList.remove("hidden");
      }, 600);
    }
    if (fo.y > CANVAS_HEIGHT) fallingObjects.splice(i, 1);
  });

  score++;
  highScore = Math.max(score, highScore);
  localStorage.setItem("auragnalHighScore", highScore);

  gameScoreDisplay.innerText = `SCORE: ${score} | HIGH: ${highScore}`;

  requestAnimationFrame(animate);
}

// Button Events
startBtn.onclick = () => {
  gameStarted = true;
  gameOverlay.classList.add("hidden");
  startBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  desktopInstructions.classList.add("hidden");
  gameScoreDisplay.style.visibility = "visible";
  mobileControls.classList.remove("hidden");
  if (!audioStarted) {
    bgMusic.play();
    audioStarted = true;
  }
  resetGame();
};

tryAgainBtn.onclick = () => {
  if (!tryAgainCooldown) {
    tryAgainCooldown = true;
    setTimeout(() => {
      tryAgainCooldown = false;
    }, 1000);
    resetGame();
  }
};

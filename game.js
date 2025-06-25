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
const gameScoreDisplay = document.getElementById("score-container");
const gameWrapper = document.getElementById("game-wrapper");

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

const keysPressed = new Set();

// Background Image
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

// Cart Images (empty, partial, full, broken)
const cartFrames = ["cart_empty.png", "cart_partial.png", "cart_full.png", "cart_broken.png"].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

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
    return !(
      player.x > this.x + this.size ||
      player.x + player.width < this.x ||
      player.y > this.y + this.size ||
      player.y + player.height < this.y
    );
  }
}

class Player {
  constructor() {
    this.scale = 0.12; // adjusted size per your last fix
    this.x = 100;
    this.y = CANVAS_HEIGHT - 380 * this.scale - 40;
    this.dy = 0;
    this.width = 405 * this.scale;
    this.height = 380 * this.scale;
    this.jumpPower = -22; // increased jump power
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
    this.state = 3; // broken cart frame
    if (!isMuted) sounds.death.play();
  }
}

const player = new Player();
let collectibles = [];
let obstacles = [];
let fallingObstacles = false;

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

// Spawn functions
function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 48));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 48));
}

function spawnFallingObstacles() {
  if (fallingObstacles) return; // prevent multiple intervals
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
  ctx.fillText(`Score: ${score}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 140, 30);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#588749";
  ctx.font = "36px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function resetGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 4;
  frameCount = 0;
  collectibles = [];
  obstacles = [];
  player.isDead = false;
  player.state = 0;
  player.x = 100;
  player.y = CANVAS_HEIGHT - player.height - 40;
  tryAgainBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameOverlay.classList.add("hidden");
  gameScoreDisplay.style.visibility = "visible";
  if (!isMuted) sounds.music.play();
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameOver = true;
  player.die();
  highScore = Math.max(highScore, score);
  localStorage.setItem("auragnalHighScore", highScore);
  // Wait 700ms to show try again
  setTimeout(() => {
    tryAgainBtn.classList.remove("hidden");
    mobileControls.classList.add("hidden");
    letsShopBtn.classList.remove("hidden");
  }, 700);
}

// Game loop
function gameLoop() {
  if (!gameStarted) {
    drawBackground();
    drawIntroOverlay();
    return;
  }

  if (gameOver || isPaused) {
    if (gameOver) {
      drawBackground();
      player.draw();
      collectibles.forEach(c => c.draw());
      obstacles.forEach(o => o.draw());
      drawGameOver();
    }
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
      endGame();
    }
  });

  drawScore();

  frameCount++;

  if (score !== 0 && score % 50 === 0 && frameCount % 5 === 0) {
    gameSpeed += 0.1;
    spawnFallingObstacles();
  }

  requestAnimationFrame(gameLoop);
}

// Intro Overlay drawing (when game not started)
function drawIntroOverlay() {
  // Clear with semi-transparent black
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = "#FFFAFA";
  ctx.textAlign = "center";
  ctx.shadowColor = "#000";
  ctx.shadowBlur = 8;
  ctx.font = "28px Cinzel Decorative";
  ctx.fillText("Welcome to AURAGNAL Mystery Shopper", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText("Collect, Dodge, Survive in Style.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.font = "18px Cinzel Decorative";
  ctx.fillText("Controls:", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  ctx.fillText("Desktop: Arrow ← ↑ → keys to move & jump, ENTER to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  ctx.fillText("Mobile: Tap circles below to Move Left, Jump, Move Right", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
}

// ... [everything you've already seen from earlier message remains unchanged above this line]

startBtn.onclick = () => {
  gameStarted = true;
  startBtn.style.display = "none";
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  resetGame();
};

tryAgainBtn.onclick = () => {
  gameStarted = true;
  tryAgainBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
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
  if (!isPaused && !gameOver) requestAnimationFrame(gameLoop);
};

// Desktop Keyboard Support
window.addEventListener("keydown", (e) => {
  keysPressed.add(e.code);
  if (["ArrowUp", "Space", "KeyW"].includes(e.code)) player.jump();
  if (["Enter"].includes(e.code) && gameOver) {
    tryAgainBtn.click();
  }
});
window.addEventListener("keyup", (e) => keysPressed.delete(e.code));

// Handle continuous movement
function handleKeysHeld() {
  if (keysPressed.has("ArrowLeft") || keysPressed.has("KeyA")) player.moveLeft();
  if (keysPressed.has("ArrowRight") || keysPressed.has("KeyD")) player.moveRight();
  requestAnimationFrame(handleKeysHeld);
}
handleKeysHeld();

// Mobile Multi-Touch Support
let mobileControlsPressed = {};

function addMobileControl(id, action) {
  const btn = document.getElementById(id);
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    mobileControlsPressed[id] = true;
    if (action === "jump") player.jump();
  });
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    mobileControlsPressed[id] = false;
  });
}

addMobileControl("mobile-left", "left");
addMobileControl("mobile-right", "right");
addMobileControl("mobile-up", "jump");

function handleMobileHeld() {
  if (mobileControlsPressed["mobile-left"]) player.moveLeft();
  if (mobileControlsPressed["mobile-right"]) player.moveRight();
  requestAnimationFrame(handleMobileHeld);
}
handleMobileHeld();

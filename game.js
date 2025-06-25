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
let gameSpeed = 4;
let score = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;

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

// GameObject class for obstacles & collectibles
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
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
  }
  collides(player) {
    // Better collision with padding
    const padding = 10;
    return !(
      player.x + padding > this.x + this.size ||
      player.x + player.width - padding < this.x ||
      player.y + padding > this.y + this.size ||
      player.y + player.height - padding < this.y
    );
  }
}

class Player {
  constructor() {
    this.scale = 0.14; // Adjusted size - tweak this if needed
    this.x = 100;
    this.y = CANVAS_HEIGHT - 380 * this.scale - 40;
    this.dy = 0;
    this.width = 405 * this.scale;
    this.height = 380 * this.scale;
    this.jumpPower = -22; // Increased jump power as requested
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
    this.state = 3; // broken cart
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
  // Score drawn in DOM element outside canvas for better control
  gameScoreDisplay.textContent = `Score: ${score} | High Score: ${highScore}`;
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#588749";
  ctx.font = "32px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
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
  player.y = CANVAS_HEIGHT - player.height - 40;
  tryAgainBtn.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  gameScoreDisplay.style.visibility = "visible";
  isPaused = false;
  if (!isMuted) sounds.music.play();
  requestAnimationFrame(gameLoop);
}

function endGameSequence() {
  player.die();
  gameOver = true;
  highScore = Math.max(highScore, score);
  localStorage.setItem("auragnalHighScore", highScore);

  // Show broken cart for 1 second, then show Try Again button & hide mobile controls
  mobileControls.classList.add("hidden");
  gameScoreDisplay.style.visibility = "visible";
  drawGameOver();

  setTimeout(() => {
    tryAgainBtn.classList.remove("hidden");
    letsShopBtn.classList.remove("hidden");
  }, 1000);
}

function gameLoop() {
  if (!gameStarted) return;

  if (isPaused) {
    requestAnimationFrame(gameLoop);
    return;
  }

  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();

  player.update();
  player.draw();

  if (frameCount % 140 === 0) spawnCollectible();
  if (frameCount % 220 === 0 && !fallingObstacles) spawnObstacle();

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
    if (o.collides(player) && !gameOver) {
      endGameSequence();
    }
    if (o.marked) obstacles.splice(i, 1);
  });

  drawScore();

  frameCount++;

  // Increase speed and trigger falling obstacles every 50 score (once)
  if (score !== 0 && score % 50 === 0 && frameCount % 5 === 0 && !fallingObstacles) {
    gameSpeed += 0.5;
    spawnFallingObstacles();
  }

  requestAnimationFrame(gameLoop);
}

// Control flags for multi-touch mobile buttons
const mobilePressed = {
  left: false,
  up: false,
  right: false,
};

function handleMobileControls() {
  if (mobilePressed.up) player.jump();
  if (mobilePressed.left) player.moveLeft();
  if (mobilePressed.right) player.moveRight();
}

// Mobile Buttons Touch Events for tap and hold
mobileLeft.addEventListener("touchstart", (e) => {
  e.preventDefault();
  mobilePressed.left = true;
  handleMobileControls();
});
mobileLeft.addEventListener("touchend", (e) => {
  e.preventDefault();
  mobilePressed.left = false;
});

mobileRight.addEventListener("touchstart", (e) => {
  e.preventDefault();
  mobilePressed.right = true;
  handleMobileControls();
});
mobileRight.addEventListener("touchend", (e) => {
  e.preventDefault();
  mobilePressed.right = false;
});

mobileUp.addEventListener("touchstart", (e) => {
  e.preventDefault();
  mobilePressed.up = true;
  handleMobileControls();
});
mobileUp.addEventListener("touchend", (e) => {
  e.preventDefault();
  mobilePressed.up = false;
});

// Desktop keyboard events
const keysPressed = new Set();

window.addEventListener("keydown", (e) => {
  if (!gameStarted) return;

  keysPressed.add(e.code);

  if (keysPressed.has("ArrowUp") || keysPressed.has("Space") || keysPressed.has("KeyW")) {
    player.jump();
  }
  if (keysPressed.has("ArrowLeft") || keysPressed.has("KeyA")) {
    player.moveLeft();
  }
  if (keysPressed.has("ArrowRight") || keysPressed.has("KeyD")) {
    player.moveRight();
  }
  if (e.code === "Enter" && gameOver) {
    tryAgainBtn.click();
  }
});

window.addEventListener("keyup", (e) => {
  keysPressed.delete(e.code);
});

// Button clicks
startBtn.onclick = () => {
  gameStarted = true;
  startBtn.style.display = "none";
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  resetGame();
};

tryAgain

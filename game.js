// game.js - AURAGNAL vControl-X Final

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

let gameSpeed = 5;
let gravity = 1;
let gameStarted = false;
let gamePaused = false;
let currentScore = 0;
let highScore = localStorage.getItem("auragnalHighScore") || 0;
let obstacles = [];
let fallingObstacles = [];
let frame = 0;
let showTryAgainTimeout;

const gameScoreDisplay = document.getElementById("scoreDisplay");
const highScoreDisplay = document.getElementById("highScoreDisplay");
const gameOverlay = document.getElementById("gameOverlay");
const startBtn = document.getElementById("startBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const letsShopBtn = document.getElementById("lets-shop");
const mobileControls = document.getElementById("mobile-controls");
const pauseBtn = document.getElementById("pauseBtn");
const muteBtn = document.getElementById("muteBtn");

let keys = {
  ArrowLeft: false,
  ArrowRight: false,
  ArrowUp: false,
};

document.addEventListener("keydown", (e) => {
  if (e.code in keys) keys[e.code] = true;
  if (e.code === "Enter" && !gameStarted) startGame();
});
document.addEventListener("keyup", (e) => {
  if (e.code in keys) keys[e.code] = false;
});

document.getElementById("leftBtn").addEventListener("touchstart", () => keys.ArrowLeft = true);
document.getElementById("leftBtn").addEventListener("touchend", () => keys.ArrowLeft = false);
document.getElementById("rightBtn").addEventListener("touchstart", () => keys.ArrowRight = true);
document.getElementById("rightBtn").addEventListener("touchend", () => keys.ArrowRight = false);
document.getElementById("upBtn").addEventListener("touchstart", () => keys.ArrowUp = true);
document.getElementById("upBtn").addEventListener("touchend", () => keys.ArrowUp = false);

pauseBtn.onclick = () => gamePaused = !gamePaused;
muteBtn.onclick = () => audioEnabled = !audioEnabled;

startBtn.onclick = startGame;
tryAgainBtn.onclick = () => {
  tryAgainBtn.classList.add("hidden");
  resetGame();
  startGame();
};

function startGame() {
  gameStarted = true;
  startBtn.style.display = "none";
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  resetGame();
}

function resetGame() {
  currentScore = 0;
  gameSpeed = 5;
  frame = 0;
  obstacles = [];
  fallingObstacles = [];
  player = new Player();
  animate();
}

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
    if (keys.ArrowUp && this.grounded) {
      this.dy = this.jumpPower;
      this.grounded = false;
    }

    if (!this.grounded) {
      this.dy += gravity;
      this.y += this.dy;
      if (this.y >= CANVAS_HEIGHT - this.height - 40) {
        this.y = CANVAS_HEIGHT - this.height - 40;
        this.dy = 0;
        this.grounded = true;
      }
    }

    if (keys.ArrowLeft) this.x -= gameSpeed;
    if (keys.ArrowRight) this.x += gameSpeed;
  }

  draw() {
    ctx.fillStyle = this.isDead ? "#800000" : "#FFFAFA";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }
}

class Obstacle {
  constructor() {
    this.width = 60;
    this.height = 60;
    this.x = CANVAS_WIDTH;
    this.y = CANVAS_HEIGHT - this.height - 40;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.fillStyle = "#fff";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }
}

class FallingObstacle {
  constructor() {
    this.size = 40;
    this.x = Math.random() * (CANVAS_WIDTH - this.size);
    this.y = -this.size;
    this.dy = 4 + Math.random() * 4;
  }

  update() {
    this.y += this.dy;
  }

  draw() {
    ctx.fillStyle = "#B22222";
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }

  getBounds() {
    return { x: this.x, y: this.y, w: this.size, h: this.size };
  }
}

let player = new Player();

function spawnObstacle() {
  if (frame % 100 === 0) obstacles.push(new Obstacle());
  if (currentScore >= 50 && frame % 50 === 0) fallingObstacles.push(new FallingObstacle());
}

function detectCollision(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function animate() {
  if (!gameStarted || gamePaused) return;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  player.update();
  player.draw();

  spawnObstacle();

  obstacles.forEach((ob, i) => {
    ob.update();
    ob.draw();
    if (detectCollision(player.getBounds(), ob.getBounds()) && !player.isDead) {
      endGame();
    }
    if (ob.x + ob.width < 0) obstacles.splice(i, 1);
  });

  fallingObstacles.forEach((fo, i) => {
    fo.update();
    fo.draw();
    if (detectCollision(player.getBounds(), fo.getBounds()) && !player.isDead) {
      endGame();
    }
    if (fo.y > CANVAS_HEIGHT) fallingObstacles.splice(i, 1);
  });

  ctx.fillStyle = "#FFFAFA";
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${currentScore}`, 20, 30);
  ctx.fillText(`High Score: ${highScore}`, 20, 60);

  currentScore++;
  if (currentScore > highScore) {
    highScore = currentScore;
    localStorage.setItem("auragnalHighScore", highScore);
  }

  if (currentScore === 50) gameSpeed = 7;

  frame++;
  requestAnimationFrame(animate);
}

function endGame() {
  player.isDead = true;
  gameStarted = false;
  clearTimeout(showTryAgainTimeout);

  showTryAgainTimeout = setTimeout(() => {
    tryAgainBtn.classList.remove("hidden");
    letsShopBtn.classList.remove("hidden");
    mobileControls.classList.add("hidden");
  }, 700);
}

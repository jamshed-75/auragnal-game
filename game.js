const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = canvas.width = 960;
const CANVAS_HEIGHT = canvas.height = 540;

// Assets
const playerImg = new Image();
playerImg.src = "assets/cart/cart_full.png";

const cartBrokenImg = new Image();
cartBrokenImg.src = "assets/cart/cart_broken.png";

const obstacleImg = new Image();
obstacleImg.src = "assets/images/obstacle_cart.png";

const fallingObstacleImg = new Image();
fallingObstacleImg.src = "assets/images/obstacle_hanger.png";

const collectibleImg = new Image();
collectibleImg.src = "assets/images/handbag.png";

// UI elements
const startBtn = document.getElementById("startBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const letsShopBtn = document.getElementById("letsShopBtn");
const gameOverlay = document.getElementById("gameOverlay");
const mobileControls = document.getElementById("mobileControls");
const leftBtn = document.getElementById("leftBtn");
const upBtn = document.getElementById("upBtn");
const rightBtn = document.getElementById("rightBtn");
const muteBtn = document.getElementById("muteBtn");
const pauseBtn = document.getElementById("pauseBtn");
const gameScoreDisplay = document.getElementById("gameScoreDisplay");

let gameStarted = false;
let isGameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("auragnalHighScore")) || 0;
let speed = 4;
let obstacles = [];
let fallingObstacles = [];
let collectibles = [];
let keys = {};
let frameCount = 0;
let jumpCooldown = 0;
let audioMuted = false;
let showBrokenCart = false;

// Sounds
const jumpSound = new Audio("assets/sound/jump.wav");
const collectSound = new Audio("assets/sound/collect.ogg");
const deathSound = new Audio("assets/sound/death.wav");
const gameMusic = new Audio("assets/sound/game.wav");
gameMusic.loop = true;

// Classes
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
    if (this.isDead) return;

    // Gravity
    this.dy += 1.2;
    this.y += this.dy;

    if (this.y + this.height >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - this.height - 40;
      this.grounded = true;
      this.dy = 0;
    } else {
      this.grounded = false;
    }

    // Move Left or Right
    if (keys["ArrowLeft"]) this.x -= 6;
    if (keys["ArrowRight"]) this.x += 6;

    // Boundaries
    this.x = Math.max(0, Math.min(this.x, CANVAS_WIDTH - this.width));
  }

  jump() {
    if (this.grounded && jumpCooldown <= 0) {
      this.dy = this.jumpPower;
      this.grounded = false;
      jumpCooldown = 20;
      if (!audioMuted) jumpSound.play();
    }
  }

  draw() {
    if (this.isDead && showBrokenCart) {
      ctx.drawImage(cartBrokenImg, this.x, this.y, this.width, this.height);
    } else {
      ctx.drawImage(playerImg, this.x, this.y, this.width, this.height);
    }
  }

  reset() {
    this.x = 100;
    this.y = CANVAS_HEIGHT - 380 * this.scale - 40;
    this.dy = 0;
    this.isDead = false;
    showBrokenCart = false;
  }
}

class Obstacle {
  constructor(x, isFalling = false) {
    this.x = x;
    this.y = isFalling ? -50 : CANVAS_HEIGHT - 90;
    this.width = 60;
    this.height = 60;
    this.isFalling = isFalling;
  }

  update() {
    this.x -= speed;
    if (this.isFalling) this.y += 6;
  }

  draw() {
    const img = this.isFalling ? fallingObstacleImg : obstacleImg;
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  }
}

class Collectible {
  constructor(x) {
    this.x = x;
    this.y = CANVAS_HEIGHT - 100;
    this.width = 50;
    this.height = 50;
  }

  update() {
    this.x -= speed;
  }

  draw() {
    ctx.drawImage(collectibleImg, this.x, this.y, this.width, this.height);
  }
}

const player = new Player();

function resetGame() {
  score = 0;
  speed = 4;
  isGameOver = false;
  player.reset();
  obstacles = [];
  fallingObstacles = [];
  collectibles = [];
  frameCount = 0;
  jumpCooldown = 0;
  showBrokenCart = false;
  gameScoreDisplay.innerHTML = `Score: 0<br>High Score: ${highScore}`;
}

function gameOver() {
  isGameOver = true;
  player.isDead = true;
  if (!audioMuted) deathSound.play();
  showBrokenCart = true;
  setTimeout(() => {
    tryAgainBtn.classList.remove("hidden");
    letsShopBtn.classList.remove("hidden");
  }, 1000);
  gameMusic.pause();
}

function animate() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (gameStarted && !isGameOver) {
    frameCount++;

    player.update();
    player.draw();

    // Handle jump cooldown
    if (jumpCooldown > 0) jumpCooldown--;

    // Spawn logic
    if (frameCount % 90 === 0) {
      obstacles.push(new Obstacle(CANVAS_WIDTH + 100));
    }

    if (frameCount % 130 === 0) {
      collectibles.push(new Collectible(CANVAS_WIDTH + 100));
    }

    if (score >= 50 && frameCount % 240 === 0) {
      fallingObstacles.push(new Obstacle(Math.random() * CANVAS_WIDTH, true));
      speed += 0.2;
    }

    // Update & draw obstacles
    [...obstacles, ...fallingObstacles].forEach(ob => {
      ob.update();
      ob.draw();

      if (
        player.x < ob.x + ob.width &&
        player.x + player.width > ob.x &&
        player.y < ob.y + ob.height &&
        player.y + player.height > ob.y
      ) {
        gameOver();
      }
    });

    // Update & draw collectibles
    collectibles.forEach((c, i) => {
      c.update();
      c.draw();

      if (
        player.x < c.x + c.width &&
        player.x + player.width > c.x &&
        player.y < c.y + c.height &&
        player.y + player.height > c.y
      ) {
        if (!audioMuted) collectSound.play();
        score += 10;
        collectibles.splice(i, 1);
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("auragnalHighScore", highScore);
        }
      }
    });

    // Display score
    gameScoreDisplay.innerHTML = `Score: ${score}<br>High Score: ${highScore}`;
  }

  requestAnimationFrame(animate);
}

// Controls
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && isGameOver) {
    tryAgainBtn.click();
  }
  keys[e.key] = true;
  if (e.key === "ArrowUp") player.jump();
});
document.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Mobile buttons
leftBtn.addEventListener("touchstart", () => (keys["ArrowLeft"] = true));
leftBtn.addEventListener("touchend", () => (keys["ArrowLeft"] = false));
rightBtn.addEventListener("touchstart", () => (keys["ArrowRight"] = true));
rightBtn.addEventListener("touchend", () => (keys["ArrowRight"] = false));
upBtn.addEventListener("touchstart", () => player.jump());

// Buttons
startBtn.onclick = () => {
  gameStarted = true;
  startBtn.classList.add("hidden");
  letsShopBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  gameScoreDisplay.style.visibility = "visible";
  resetGame();
  if (!audioMuted) gameMusic.play();
};

tryAgainBtn.onclick = () => {
  tryAgainBtn.classList.add("hidden");
  gameOverlay.classList.add("hidden");
  mobileControls.classList.remove("hidden");
  resetGame();
  gameStarted = true;
  if (!audioMuted) gameMusic.play();
};

letsShopBtn.onclick = () => {
  window.location.href = "/collections/all";
};

muteBtn.onclick = () => {
  audioMuted = !audioMuted;
  muteBtn.textContent = audioMuted ? "Unmute" : "Mute";
  if (audioMuted) gameMusic.pause();
  else if (gameStarted && !isGameOver) gameMusic.play();
};

pauseBtn.onclick = () => {
  if (!isGameOver) gameStarted = !gameStarted;
  if (gameStarted && !audioMuted) gameMusic.play();
  else gameMusic.pause();
};

// Start animation
animate();

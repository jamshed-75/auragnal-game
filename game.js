const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");

let gameStarted = false;
let gameOver = false;
let score = 0;
let gravity = 1.5;
let gameSpeed = 5;
let frameCount = 0;

// Responsive canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Load Sounds
const sounds = {
  start: new Audio("assets/sounds/start.mp3"),
  collect: new Audio("assets/sounds/collect.ogg"),
  jump: new Audio("assets/sounds/jump.wav"),
  death: new Audio("assets/sounds/death.wav"),
  message: new Audio("assets/sounds/message.wav"),
  game: new Audio("assets/sounds/game.wav"),
};
sounds.game.loop = true;

// Player Class with animation frames
class Player {
  constructor() {
    this.width = 64;
    this.height = 64;
    this.x = 100;
    this.y = canvas.height - this.height - 40;
    this.dy = 0;
    this.jumpPower = -22;
    this.grounded = true;
    this.frame = 1;
    this.frameDelay = 5;
    this.frameCount = 32;
    this.state = "run"; // idle, run, jump, death
    this.frameTimer = 0;
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.height >= canvas.height - 40) {
      this.y = canvas.height - this.height - 40;
      this.dy = 0;
      this.grounded = true;
      if (this.state === "jump") this.state = "run";
    } else {
      this.grounded = false;
    }

    this.frameTimer++;
    if (this.frameTimer >= this.frameDelay) {
      this.frame++;
      if (this.frame > this.frameCount) this.frame = 1;
      this.frameTimer = 0;
    }
  }

  draw() {
    const img = new Image();
    img.src = `assets/player/${this.state}/${this.frame}.png`;
    ctx.drawImage(img, this.x, this.y, this.width * 2, this.height * 2);
  }

  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.state = "jump";
      this.grounded = false;
      sounds.jump.play();
    }
  }
}

class GameObject {
  constructor(imgSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - height - 40;
    this.speed = speed;
    this.markedForDeletion = false;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.width < 0) this.markedForDeletion = true;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collidesWith(player) {
    return !(
      player.x > this.x + this.width ||
      player.x + player.width < this.x ||
      player.y > this.y + this.height ||
      player.y + player.height < this.y
    );
  }
}

// Setup
const player = new Player();
let collectibles = [];
let obstacles = [];

const collectibleImages = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earings.png",
];

const obstacleImages = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

function spawnCollectible() {
  const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(imgSrc, 60, 60, gameSpeed));
}

function drawScore() {
  ctx.font = "bold 24px Cinzel Decorative";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 5;
  ctx.fillText(`Score: ${score}`, 20, 50);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap Start to Restart", canvas.width / 2, canvas.height / 2 + 60);
}

function resetGame() {
  score = 0;
  gameSpeed = 5;
  collectibles = [];
  obstacles = [];
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  frameCount = 0;
  gameOver = false;
  sounds.game.currentTime = 0;
  sounds.game.play();

  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  gameTitle.style.display = "none";

  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    sounds.game.pause();
    sounds.death.play();
    startBtn.style.display = "block";
    letsShopBtn.style.display = "block";
    gameTitle.style.display = "block";
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  const bg = new Image();
  bg.src = "assets/images/bg.jpg";
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  player.update();
  player.draw();

  // Spawning
  if (frameCount % 150 === 0) spawnCollectible();
  if (frameCount % 180 === 0) spawnObstacle();

  collectibles.forEach((col, i) => {
    col.update();
    col.draw();
    if (col.collidesWith(player)) {
      score += 10;
      sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((obs, i) => {
    obs.update();
    obs.draw();
    if (obs.collidesWith(player)) {
      gameOver = true;
    }
  });

  collectibles = collectibles.filter(c => !c.markedForDeletion);
  obstacles = obstacles.filter(o => !o.markedForDeletion);

  drawScore();

  frameCount++;
  if (frameCount % 600 === 0) gameSpeed += 0.4;

  requestAnimationFrame(gameLoop);
}

// Controls
function handleKeyDown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
}
function handleTouchStart() {
  player.jump();
}

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    sounds.start.play();
    gameStarted = true;
  }
  resetGame();
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("touchstart", handleTouchStart);

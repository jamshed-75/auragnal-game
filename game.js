const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");

let gameStarted = false;
let score = 0;
let gameSpeed = 5;
let gravity = 1.2;
let frameCount = 0;

// Canvas sizing for crisp 16:9 ratio and scaling
function resizeCanvas() {
  const container = document.getElementById("game-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
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

// Player Animations
class Animation {
  constructor(image, frameWidth, frameHeight, frameCount, frameSpeed) {
    this.image = image;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.frameSpeed = frameSpeed;
    this.currentFrame = 0;
    this.counter = 0;
  }
  update() {
    this.counter++;
    if (this.counter >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.counter = 0;
    }
  }
  draw(ctx, x, y, scale = 1) {
    ctx.drawImage(
      this.image,
      this.currentFrame * this.frameWidth,
      0,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth * scale,
      this.frameHeight * scale
    );
  }
}

// Load sprite sheets for player
const playerImages = {
  idle: new Image(),
  run: new Image(),
  jump: new Image(),
  death: new Image(),
};
playerImages.idle.src = "assets/player/idle/sprite.png";
playerImages.run.src = "assets/player/run/sprite.png";
playerImages.jump.src = "assets/player/jump/sprite.png";
playerImages.death.src = "assets/player/death/sprite.png";

const PLAYER_SCALE = 2;

const playerAnimData = {
  frameWidth: 64,
  frameHeight: 64,
  frameCount: 32,
  frameSpeed: 4,
};

const playerAnimations = {
  idle: new Animation(
    playerImages.idle,
    playerAnimData.frameWidth,
    playerAnimData.frameHeight,
    playerAnimData.frameCount,
    playerAnimData.frameSpeed
  ),
  run: new Animation(
    playerImages.run,
    playerAnimData.frameWidth,
    playerAnimData.frameHeight,
    playerAnimData.frameCount,
    playerAnimData.frameSpeed
  ),
  jump: new Animation(
    playerImages.jump,
    playerAnimData.frameWidth,
    playerAnimData.frameHeight,
    playerAnimData.frameCount,
    playerAnimData.frameSpeed
  ),
  death: new Animation(
    playerImages.death,
    playerAnimData.frameWidth,
    playerAnimData.frameHeight,
    playerAnimData.frameCount,
    playerAnimData.frameSpeed
  ),
};

class Player {
  constructor() {
    this.width = playerAnimData.frameWidth * PLAYER_SCALE;
    this.height = playerAnimData.frameHeight * PLAYER_SCALE;
    this.x = 100;
    this.y = canvas.height - this.height - 40;
    this.dy = 0;
    this.jumpPower = -22;
    this.grounded = true;
    this.state = "idle"; // idle, run, jump, death
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
  }
  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.grounded = false;
      this.state = "jump";
      sounds.jump.play();
    }
  }
  draw() {
    playerAnimations[this.state].update();
    playerAnimations[this.state].draw(ctx, this.x, this.y, PLAYER_SCALE);
  }
}

// Collectibles & Obstacles
class GameObject {
  constructor(imgSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 500;
    this.y = canvas.height - height - 40;
    this.speed = speed;
    this.collected = false;
  }
  update() {
    this.x -= this.speed;
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  isOffScreen() {
    return this.x + this.width < 0;
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

// Manage game state
const player = new Player();

let collectibles = [];
let obstacles = [];
let collectibleImages = [
  "assets/images/dress/1.png",
  "assets/images/heels/1.png",
  "assets/images/handbag/1.png",
  "assets/images/earings/1.png",
];
let obstacleImages = [
  "assets/images/obstacle_cart/1.png",
  "assets/images/obstacle_bag/1.png",
  "assets/images/obstacle_hanger/1.png",
];

function spawnCollectible() {
  const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(imgSrc, 60, 60, gameSpeed));
}

// Score display
function drawScore() {
  ctx.font = "bold 28px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 8;
  ctx.fillText(`Score: ${score}`, 20, 50);
}

// Game Over Display
function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative, cursive";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "28px Cinzel Decorative, cursive";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Refresh page to try again", canvas.width / 2, canvas.height / 2 + 60);
}

let gameOver = false;

function resetGame() {
  score = 0;
  gameSpeed = 5;
  collectibles = [];
  obstacles = [];
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "idle";
  gameOver = false;
  sounds.game.play();
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  gameLoop();
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    sounds.game.pause();
    sounds.death.play();
    startBtn.style.display = "block";
    letsShopBtn.style.display = "block";
    gameTitle.style.display = "block";
    startBtn.textContent = "Restart Game";
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background already handled by CSS

  // Update & draw player
  player.update();
  player.draw();

  // Spawn collectibles & obstacles periodically
  if (frameCount % 150 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

  // Update and draw collectibles
  collectibles.forEach((col, index) => {
    col.update();
    col.draw();
    if (col.collidesWith(player)) {
      score += 10;
      sounds.collect.play();
      collectibles.splice(index, 1);
    } else if (col.isOffScreen()) {
      collectibles.splice(index, 1);
    }
  });

  // Update and draw obstacles
  obstacles.forEach((obs, index) => {
    obs.update();
    obs.draw();
    if (obs.collidesWith(player)) {
      gameOver = true;
      sounds.death.play();
    } else if (obs.isOffScreen()) {
      obstacles.splice(index, 1);
    }
  });

  // Increase difficulty every 500 frames
  if (frameCount % 500 === 0) {
    gameSpeed += 0.5;
  }

  drawScore();

  frameCount++;
  requestAnimationFrame(gameLoop);
}

function startGame() {
  if (!gameStarted) {
    gameStarted

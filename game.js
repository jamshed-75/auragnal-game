const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let gameStarted = false;
let isMuted = false;
let gameOver = false;
let score = 0;
let gameSpeed = 5;
let gravity = 1.5;
let frameCount = 0;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load background image
const bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";

// Load sounds
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};
sounds.game.loop = true;

function toggleMute() {
  isMuted = !isMuted;
  for (const sound of Object.values(sounds)) {
    sound.muted = isMuted;
  }
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
}
muteBtn.addEventListener("click", toggleMute);

// Animation handler (spritesheet single PNG: 5 columns x 4 rows)
class Animation {
  constructor(imageSrc, rows = 4, cols = 5) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.rows = rows;
    this.cols = cols;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.scale = 2;
    this.currentFrame = 0;
    this.totalFrames = rows * cols;
    this.frameSpeed = 6;
    this.frameTimer = 0;
  }
  update() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.frameTimer = 0;
    }
  }
  draw(x, y) {
    const col = this.currentFrame % this.cols;
    const row = Math.floor(this.currentFrame / this.cols);
    ctx.drawImage(
      this.image,
      col * this.frameWidth,
      row * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth * this.scale,
      this.frameHeight * this.scale
    );
  }
}

const playerAnimations = {
  idle: new Animation("assets/player/idle/sprite.png"),
  run: new Animation("assets/player/run/sprite.png"),
  jump: new Animation("assets/player/jump/sprite.png"),
  death: new Animation("assets/player/death/sprite.png"),
};

class Player {
  constructor() {
    this.width = 64 * 2;
    this.height = 64 * 2;
    this.x = 100;
    this.y = canvas.height - this.height - 40;
    this.dy = 0;
    this.jumpPower = -22;
    this.grounded = true;
    this.state = "idle";
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
    playerAnimations[this.state].draw(this.x, this.y);
  }
}

class GameObject {
  constructor(src, width, height, speed) {
    this.image = new Image();
    this.image.src = src;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 300 + 100;
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

const player = new Player();
const collectibles = [];
const obstacles = [];

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
  const img = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(img, 50, 50, gameSpeed));
}
function spawnObstacle() {
  const img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(img, 60, 60, gameSpeed));
}

function drawScore() {
  ctx.font = "28px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 50);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "28px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap Start to Try Again", canvas.width / 2, canvas.height / 2 + 60);
}

function resetGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  gameSpeed = 5;
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  collectibles.length = 0;
  obstacles.length = 0;
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  gameTitle.style.display = "none";
  sounds.game.currentTime = 0;
  sounds.game.play();
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    sounds.game.pause();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  player.update();
  player.draw();

  if (frameCount % 160 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  for (let c of collectibles) {
    c.update();
    c.draw();
    if (c.collidesWith(player)) {
      score += 10;
      sounds.collect.play();
      c.markedForDeletion = true;
    }
  }
  for (let o of obstacles) {
    o.update();
    o.draw();
    if (o.collidesWith(player)) {
      sounds.death.play();
      gameOver = true;
    }
  }

  drawScore();

  collectibles.filter(c => !c.markedForDeletion);
  obstacles.filter(o => !o.markedForDeletion);

  if (frameCount % 500 === 0) gameSpeed += 0.5;
  frameCount++;
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});
window.addEventListener("touchstart", () => player.jump());

startBtn.addEventListener("click", () => {
  sounds.start.play();
  resetGame();
});

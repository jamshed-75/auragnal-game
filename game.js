const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let gameStarted = false;
let score = 0;
let gameSpeed = 5;
let gravity = 1.5;
let frameCount = 0;
let isMuted = false;

// Responsive canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Load Sounds
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};
sounds.game.loop = true;

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";

// Player Animations (single sprite.png per folder)
class SpriteAnimation {
  constructor(imgPath, frameWidth, frameHeight, rows, cols) {
    this.image = new Image();
    this.image.src = imgPath;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.rows = rows;
    this.cols = cols;
    this.currentFrame = 0;
    this.frameSpeed = 4;
    this.frameTimer = 0;
  }

  update() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % (this.rows * this.cols);
      this.frameTimer = 0;
    }
  }

  draw(ctx, x, y, scale = 2) {
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
      this.frameWidth * scale,
      this.frameHeight * scale
    );
  }
}

const playerAnimations = {
  idle: new SpriteAnimation("assets/player/idle/sprite.png", 64, 64, 5, 4),
  run: new SpriteAnimation("assets/player/run/sprite.png", 64, 64, 5, 4),
  jump: new SpriteAnimation("assets/player/jump/sprite.png", 64, 64, 5, 4),
  death: new SpriteAnimation("assets/player/death/sprite.png", 64, 64, 5, 4),
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
      if (!isMuted) sounds.jump.play();
    }
  }

  draw() {
    playerAnimations[this.state].update();
    playerAnimations[this.state].draw(ctx, this.x, this.y);
  }
}

class GameObject {
  constructor(imgSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 400;
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
  const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(imgSrc, 60, 60, gameSpeed));
}

function drawScore() {
  ctx.font = "bold 24px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Click 'Start Game' to retry", canvas.width / 2, canvas.height / 2 + 50);
}

let gameOver = false;

function resetGame() {
  score = 0;
  gameSpeed = 5;
  collectibles.length = 0;
  obstacles.length = 0;
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  gameOver = false;

  if (!isMuted) {
    sounds.start.play();
    sounds.game.currentTime = 0;
    sounds.game.play();
  }

  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  gameTitle.style.display = "none";

  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    if (!isMuted) {
      sounds.game.pause();
      sounds.death.play();
    }
    startBtn.style.display = "block";
    letsShopBtn.style.display = "block";
    gameTitle.style.display = "block";
    startBtn.textContent = "Restart Game";
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  // Update
  player.update();
  player.draw();

  if (frameCount % 120 === 0) spawnCollectible();
  if (frameCount % 180 === 0) spawnObstacle();

  collectibles.forEach((item, i) => {
    item.update();
    item.draw();
    if (item.collidesWith(player)) {
      score += 10;
      if (!isMuted) sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((ob, i) => {
    ob.update();
    ob.draw();
    if (ob.collidesWith(player)) {
      gameOver = true;
    }
  });

  drawScore();
  collectibles.filter(c => !c.markedForDeletion);
  obstacles.filter(o => !o.markedForDeletion);

  if (frameCount % 600 === 0) gameSpeed += 0.5;
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Event Listeners
function handleJump() {
  player.jump();
}
window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") handleJump();
});
window.addEventListener("touchstart", handleJump);

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
  }
  resetGame();
});

letsShopBtn.addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) {
    Object.values(sounds).forEach(s => s.pause());
  } else {
    sounds.game.play();
  }
});

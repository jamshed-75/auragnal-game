const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let isMuted = false;
let gameStarted = false;
let score = 0;
let gameSpeed = 4;
let gravity = 1.2;
let frameCount = 0;
let gameOver = false;

function resizeCanvas() {
  canvas.width = window.innerWidth * 0.9;
  canvas.height = window.innerHeight * 0.6;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// SOUND
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};

for (let key in sounds) {
  sounds[key].volume = 0.7;
}
sounds.game.loop = true;

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  for (let key in sounds) {
    sounds[key].muted = isMuted;
  }
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
});

// PLAYER ANIMATION (sprite.png — 5 columns x 4 rows)
class SpriteAnimator {
  constructor(imageSrc, frameWidth = 64, frameHeight = 64, cols = 5, rows = 4, speed = 5) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.cols = cols;
    this.rows = rows;
    this.totalFrames = cols * rows;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.speed = speed;
    this.currentFrame = 0;
    this.tick = 0;
  }

  update() {
    this.tick++;
    if (this.tick >= this.speed) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.tick = 0;
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

// PLAYER
const playerAnimations = {
  idle: new SpriteAnimator("assets/player/idle/sprite.png"),
  run: new SpriteAnimator("assets/player/run/sprite.png"),
  jump: new SpriteAnimator("assets/player/jump/sprite.png"),
  death: new SpriteAnimator("assets/player/death/sprite.png"),
};

class Player {
  constructor() {
    this.width = 64 * 2;
    this.height = 64 * 2;
    this.x = 100;
    this.y = canvas.height - this.height - 30;
    this.dy = 0;
    this.jumpPower = -20;
    this.grounded = true;
    this.state = "idle";
  }

  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.grounded = false;
      this.state = "jump";
      sounds.jump.play();
    }
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.height >= canvas.height - 30) {
      this.y = canvas.height - this.height - 30;
      this.dy = 0;
      this.grounded = true;
      if (this.state === "jump") this.state = "run";
    }

    playerAnimations[this.state].update();
  }

  draw() {
    playerAnimations[this.state].draw(ctx, this.x, this.y);
  }
}

// GAME OBJECTS
class GameObject {
  constructor(imageSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - height - 30;
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

// GAME LOGIC
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
  const src = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(src, 40, 40, gameSpeed));
}

function spawnObstacle() {
  const src = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(src, 50, 50, gameSpeed));
}

function drawScore() {
  ctx.font = "24px Cinzel Decorative";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "42px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  startBtn.textContent = "Restart Game";
  startBtn.style.display = "block";
  gameTitle.style.display = "block";
  letsShopBtn.style.display = "block";
  sounds.death.play();
}

function resetGame() {
  score = 0;
  frameCount = 0;
  gameSpeed = 4;
  gameOver = false;
  player.y = canvas.height - player.height - 30;
  player.dy = 0;
  player.state = "run";
  collectibles = [];
  obstacles = [];
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
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

  player.update();
  player.draw();

  if (frameCount % 120 === 0) spawnCollectible();
  if (frameCount % 150 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collidesWith(player)) {
      collectibles.splice(i, 1);
      score += 10;
      sounds.collect.play();
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collidesWith(player)) {
      player.state = "death";
      gameOver = true;
    }
  });

  collectibles = collectibles.filter(c => !c.markedForDeletion);
  obstacles = obstacles.filter(o => !o.markedForDeletion);

  drawScore();

  if (frameCount % 400 === 0) gameSpeed += 0.5;
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// CONTROLS
function jumpAction() {
  player.jump();
}

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") jumpAction();
});
window.addEventListener("touchstart", jumpAction);

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    player.state = "run";
  }
  sounds.start.play();
  resetGame();
});

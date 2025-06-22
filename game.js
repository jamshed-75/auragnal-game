const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let isMuted = false;

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};

for (let key in sounds) {
  sounds[key].volume = 0.6;
}

sounds.game.loop = true;

muteBtn.onclick = () => {
  isMuted = !isMuted;
  for (let key in sounds) sounds[key].muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let gameStarted = false;
let gameOver = false;
let score = 0;
let gameSpeed = 4;
let gravity = 1.5;
let frameCount = 0;

const bgImg = new Image();
bgImg.src = "assets/images/bg.jpg";

let bgX = 0;

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

class Animation {
  constructor(src, frameWidth, frameHeight, columns, rows) {
    this.image = new Image();
    this.image.src = src;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.columns = columns;
    this.rows = rows;
    this.totalFrames = columns * rows;
    this.currentFrame = 0;
    this.frameDelay = 5;
    this.frameCount = 0;
  }

  update() {
    this.frameCount++;
    if (this.frameCount >= this.frameDelay) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.frameCount = 0;
    }
  }

  draw(ctx, x, y, scale = 2) {
    const col = this.currentFrame % this.columns;
    const row = Math.floor(this.currentFrame / this.columns);
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
  idle: new Animation("assets/player/idle/sprite.png", 64, 64, 4, 4),
  run: new Animation("assets/player/run/sprite.png", 64, 64, 5, 4),
  jump: new Animation("assets/player/jump/sprite.png", 64, 64, 6, 4),
  death: new Animation("assets/player/death/sprite.png", 64, 64, 6, 5),
};

class Player {
  constructor() {
    this.width = 64 * 2;
    this.height = 64 * 2;
    this.x = 100;
    this.y = canvas.height - this.height - 50;
    this.dy = 0;
    this.jumpPower = -25;
    this.grounded = true;
    this.state = "idle";
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.height >= canvas.height - 50) {
      this.y = canvas.height - this.height - 50;
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
      this.state = "jump";
      sounds.jump.play();
    }
  }

  draw() {
    playerAnimations[this.state].update();
    playerAnimations[this.state].draw(ctx, this.x, this.y);
  }
}

class GameObject {
  constructor(imgSrc, width, height) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width;
    this.y = canvas.height - height - 50;
    this.markedForDeletion = false;
  }

  update() {
    this.x -= gameSpeed;
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

const collectibleImgs = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earings.png",
];

const obstacleImgs = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 50, 50));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 70, 70));
}

function drawScore() {
  ctx.font = "28px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "40px Cinzel Decorative, cursive";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = "24px Cinzel Decorative, cursive";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText("Tap to Try Again", canvas.width / 2, canvas.height / 2 + 40);
}

function resetGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  frameCount = 0;
  gameSpeed = 4;
  player.y = canvas.height - player.height - 50;
  player.dy = 0;
  player.state = "run";
  obstacles.length = 0;
  collectibles.length = 0;
  sounds.game.currentTime = 0;
  sounds.start.play();
  sounds.game.play();
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  if (frameCount % 120 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

  player.update();
  player.draw();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collidesWith(player)) {
      score += 10;
      sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collidesWith(player)) {
      sounds.death.play();
      gameOver = true;
    }
  });

  drawScore();

  collectibles.filter(c => !c.markedForDeletion);
  obstacles.filter(o => !o.markedForDeletion);

  frameCount++;
  requestAnimationFrame(gameLoop);
}

startBtn.onclick = () => {
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  resetGame();
};

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});

window.addEventListener("touchstart", () => {
  if (gameOver) {
    resetGame();
  } else {
    player.jump();
  }
});

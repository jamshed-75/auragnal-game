const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");

let gameStarted = false;
let score = 0;
let gameSpeed = 4;
let gravity = 1.5;
let frameCount = 0;
let gameOver = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav")
};
sounds.game.loop = true;

class Animation {
  constructor(src, columns, rows) {
    this.image = new Image();
    this.image.src = src;
    this.columns = columns;
    this.rows = rows;
    this.totalFrames = columns * rows;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.currentFrame = 0;
    this.frameSpeed = 4;
    this.frameTimer = 0;
  }

  update() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.frameTimer = 0;
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
  idle: new Animation("assets/player/idle/sprite.png", 5, 4),
  run: new Animation("assets/player/run/sprite.png", 5, 4),
  jump: new Animation("assets/player/jump/sprite.png", 5, 4),
  death: new Animation("assets/player/death/sprite.png", 5, 4)
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
  constructor(imgSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imgSrc;
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

const collectibles = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earings.png"
];

const obstacles = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png"
];

let collectibleObjects = [];
let obstacleObjects = [];

function spawnCollectible() {
  const img = collectibles[Math.floor(Math.random() * collectibles.length)];
  collectibleObjects.push(new GameObject(img, 40, 40, gameSpeed));
}

function spawnObstacle() {
  const img = obstacles[Math.floor(Math.random() * obstacles.length)];
  obstacleObjects.push(new GameObject(img, 50, 50, gameSpeed));
}

function drawScore() {
  ctx.font = "24px 'Cinzel Decorative', cursive";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "36px 'Cinzel Decorative', cursive";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Tap Restart", canvas.width / 2, canvas.height / 2 + 50);
}

function resetGame() {
  score = 0;
  gameSpeed = 4;
  collectibleObjects = [];
  obstacleObjects = [];
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  gameOver = false;
  frameCount = 0;
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

  if (frameCount % 180 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

  collectibleObjects.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collidesWith(player)) {
      score += 10;
      sounds.collect.play();
      collectibleObjects.splice(i, 1);
    }
  });

  obstacleObjects.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collidesWith(player)) {
      player.state = "death";
      sounds.death.play();
      gameOver = true;
    }
  });

  collectibleObjects = collectibleObjects.filter(c => !c.markedForDeletion);
  obstacleObjects = obstacleObjects.filter(o => !o.markedForDeletion);

  drawScore();

  frameCount++;
  requestAnimationFrame(gameLoop);
}

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    startBtn.style.display = "none";
    gameTitle.style.display = "none";
    letsShopBtn.style.display = "none";
    player.state = "run";
    sounds.start.play();
    resetGame();
  } else if (gameOver) {
    resetGame();
  }
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});
window.addEventListener("touchstart", () => player.jump());

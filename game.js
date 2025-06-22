const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");

let gameStarted = false;
let score = 0;
let gameSpeed = 5;
let gravity = 1.5;
let frameCount = 0;
let gameOver = false;

function resizeCanvas() {
  const container = document.getElementById("game-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
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

// Universal SpriteSheet class
class SpriteSheet {
  constructor(folder, totalFrames, columns) {
    this.image = new Image();
    this.image.src = `assets/player/${folder}/sprite.png`;
    this.frameIndex = 0;
    this.totalFrames = totalFrames;
    this.columns = columns;
    this.rows = Math.ceil(totalFrames / columns);
    this.frameSpeed = 4;
    this.timer = 0;

    this.frameWidth = 64; // fallback until image loads
    this.frameHeight = 64;

    this.image.onload = () => {
      this.frameWidth = this.image.width / this.columns;
      this.frameHeight = this.image.height / this.rows;
    };
  }

  update() {
    this.timer++;
    if (this.timer >= this.frameSpeed) {
      this.frameIndex = (this.frameIndex + 1) % this.totalFrames;
      this.timer = 0;
    }
  }

  draw(x, y, scale = 1.8) {
    const col = this.frameIndex % this.columns;
    const row = Math.floor(this.frameIndex / this.columns);
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

// Player animations with exact frame counts and columns per your specs
const playerAnimations = {
  idle: new SpriteSheet("idle", 16, 4),
  run: new SpriteSheet("run", 20, 5),
  jump: new SpriteSheet("jump", 24, 6),
  death: new SpriteSheet("death", 30, 6),
};

class Player {
  constructor() {
    this.width = 64 * 2; // will be overridden visually by sprite scale
    this.height = 64 * 2;
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
    playerAnimations[this.state].draw(this.x, this.y, 1.8);
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

let collectibles = [];
let obstacles = [];

function spawnCollectible() {
  const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(imgSrc, 40, 40, gameSpeed));
}

function spawnObstacle() {
  const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
}

function drawScore() {
  ctx.font = "bold 28px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 8;
  ctx.fillText(`Score: ${score}`, 20, 50);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative, cursive";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "28px Cinzel Decorative, cursive";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap Try Again to restart", canvas.width / 2, canvas.height / 2 + 60);
}

function resetGame() {
  score = 0;
  gameSpeed = 5;
  collectibles = [];
  obstacles = [];
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "idle";
  gameOver = false;
  sounds.game.currentTime = 0;
  sounds.game.play();
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
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
    startBtn.textContent = "Restart Game";
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  const bg = new Image();
  bg.src = "assets/images/bg.jpg";
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // Draw player
  player.update();
  player.draw();

  // Spawn collectibles and obstacles
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
    }
  });

  // Update and draw obstacles
  obstacles.forEach((obs, index) => {
    obs.update();
    obs.draw();
    if (obs.collidesWith(player)) {
      gameOver = true;
    }
  });

  // Remove offscreen
  collectibles = collectibles.filter(c => !c.markedForDeletion);
  obstacles = obstacles.filter(o => !o.markedForDeletion);

  // Increase difficulty gradually
  if (frameCount % 500 === 0) {
    gameSpeed += 0.5;
  }

  drawScore();

  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Controls

function handleKeyDown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    player.jump();
  }
}

function handleTouchStart() {
  player.jump();
}

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    sounds.start.play();
    resetGame();
  }
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("touchstart", handleTouchStart);

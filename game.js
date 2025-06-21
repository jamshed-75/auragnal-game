const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");

let gameStarted = false;
let gameOver = false;
let score = 0;
let gravity = 1.2;
let frameCount = 0;
let gameSpeed = 5;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Load sounds
const sounds = {
  start: new Audio("assets/sounds/start.mp3"),
  collect: new Audio("assets/sounds/collect.ogg"),
  jump: new Audio("assets/sounds/jump.wav"),
  death: new Audio("assets/sounds/death.wav"),
  message: new Audio("assets/sounds/message.wav"),
  game: new Audio("assets/sounds/game.wav")
};
sounds.game.loop = true;

class Player {
  constructor() {
    this.width = 64;
    this.height = 64;
    this.scale = 2;
    this.x = 100;
    this.y = canvas.height - this.height * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -20;
    this.grounded = true;
    this.frameIndex = 1;
    this.maxFrames = 32;
    this.state = "idle"; // idle, run, jump, death
    this.frameTimer = 0;
    this.frameSpeed = 4;
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.height * this.scale >= canvas.height - 40) {
      this.y = canvas.height - this.height * this.scale - 40;
      this.dy = 0;
      this.grounded = true;
      if (this.state === "jump") this.state = "run";
    } else {
      this.grounded = false;
    }

    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.frameIndex = (this.frameIndex % this.maxFrames) + 1;
      this.frameTimer = 0;
    }
  }

  draw() {
    const img = new Image();
    img.src = `assets/player/${this.state}/${this.frameIndex}.png`;
    ctx.drawImage(
      img,
      this.x,
      this.y,
      this.width * this.scale,
      this.height * this.scale
    );
  }

  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.grounded = false;
      this.state = "jump";
      sounds.jump.play();
    }
  }

  reset() {
    this.y = canvas.height - this.height * this.scale - 40;
    this.dy = 0;
    this.state = "idle";
    this.frameIndex = 1;
  }
}

class GameObject {
  constructor(src, width, height, speed) {
    this.image = new Image();
    this.image.src = src;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - height - 40;
    this.speed = speed;
    this.marked = false;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.width < 0) this.marked = true;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collidesWith(player) {
    return !(
      player.x > this.x + this.width ||
      player.x + player.width * player.scale < this.x ||
      player.y > this.y + this.height ||
      player.y + player.height * player.scale < this.y
    );
  }
}

const player = new Player();

const collectibleImages = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earings.png"
];

const obstacleImages = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png"
];

let collectibles = [];
let obstacles = [];

function spawnCollectible() {
  const img = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(img, 48, 48, gameSpeed));
}

function spawnObstacle() {
  const img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(img, 60, 60, gameSpeed));
}

function drawScore() {
  ctx.font = "bold 28px Cinzel Decorative";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 8;
  ctx.fillText(`Score: ${score}`, 20, 50);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "28px Cinzel Decorative";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Refresh to try again", canvas.width / 2, canvas.height / 2 + 60);
}

function resetGame() {
  score = 0;
  gameSpeed = 5;
  collectibles = [];
  obstacles = [];
  player.reset();
  gameOver = false;
  frameCount = 0;
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
    sounds.death.play();
    startBtn.style.display = "block";
    letsShopBtn.style.display = "block";
    gameTitle.style.display = "block";
    startBtn.textContent = "Restart Game";
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Update player
  player.update();
  player.draw();

  // Spawn
  if (frameCount % 160 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

  // Draw collectibles
  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collidesWith(player)) {
      score += 10;
      sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  // Draw obstacles
  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collidesWith(player)) {
      gameOver = true;
    }
  });

  collectibles = collectibles.filter(c => !c.marked);
  obstacles = obstacles.filter(o => !o.marked);

  if (frameCount % 500 === 0) gameSpeed += 0.5;

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") {
    player.jump();
  }
}
function handleTouch() {
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
window.addEventListener("touchstart", handleTouch);

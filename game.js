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

// Player Animations using spritesheets of 32 frames width:64 height:64 each frame
class Animation {
  constructor(imageSrc) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.frameCount = 32;
    this.currentFrame = 0;
    this.frameSpeed = 4;
    this.frameTimer = 0;
  }
  update() {
    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount;
      this.frameTimer = 0;
    }
  }
  draw(ctx, x, y, scale = 2) {
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

// Load all player animations
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

const collectibleImages = [
  "assets/images/dress/1.png",
  "assets/images/heels/1.png",
  "assets/images/handbag/1.png",
  "assets/images/earings/1.png",
];

const obstacleImages = [
  "assets/images/obstacle_cart/1.png",
  "assets/images/obstacle_bag/1.png",
  "assets/images/obstacle_hanger/1.png",
];

let collectibles = [];
let obstacles = [];

function spawnCollectible() {
  const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(imgSrc, 60, 60, gameSpeed));
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

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
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (player) {
    player.y = canvas.height - player.height - 60;
  }
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav")
};
sounds.game.loop = true;

class Player {
  constructor() {
    this.sprite = new Image();
    this.sprite.src = "assets/player/run/sprite.png"; // Only ONE image per state
    this.width = 64 * 2;
    this.height = 64 * 2;
    this.x = 100;
    this.y = canvas.height - this.height - 60;
    this.dy = 0;
    this.jumpPower = -22;
    this.grounded = true;
    this.frame = 0;
  }
  update() {
    this.dy += gravity;
    this.y += this.dy;
    if (this.y + this.height >= canvas.height - 60) {
      this.y = canvas.height - 60 - this.height;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
    if (frameCount % 5 === 0) {
      this.frame = (this.frame + 1) % 20;
    }
  }
  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.grounded = false;
      sounds.jump.play();
    }
  }
  draw() {
    const cols = 5;
    const frameWidth = 64;
    const frameHeight = 64;
    const row = Math.floor(this.frame / cols);
    const col = this.frame % cols;
    ctx.drawImage(
      this.sprite,
      col * frameWidth,
      row * frameHeight,
      frameWidth,
      frameHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}

class GameObject {
  constructor(imgSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 300 + 100;
    this.y = canvas.height - height - 60;
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
  "assets/images/handbag.png",
  "assets/images/heels.png",
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
  const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(imgSrc, 40, 40, gameSpeed));
}

function spawnObstacle() {
  const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
}

function drawScore() {
  ctx.font = "bold 26px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 8;
  ctx.fillText(`Score: ${score}`, 20, 50);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 42px Cinzel Decorative, cursive";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "26px Cinzel Decorative, cursive";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap Start to Play Again", canvas.width / 2, canvas.height / 2 + 60);
}

let gameOver = false;
function resetGame() {
  score = 0;
  gameSpeed = 5;
  collectibles = [];
  obstacles = [];
  player.y = canvas.height - player.height - 60;
  player.dy = 0;
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
  player.update();
  player.draw();

  if (frameCount % 130 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

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
      gameOver = true;
    }
  });

  collectibles = collectibles.filter(c => !c.markedForDeletion);
  obstacles = obstacles.filter(o => !o.markedForDeletion);

  if (frameCount % 500 === 0) gameSpeed += 0.5;
  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
}
function handleTouchStart() {
  player.jump();
}

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    sounds.start.play();
  }
  resetGame();
});

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("touchstart", handleTouchStart);

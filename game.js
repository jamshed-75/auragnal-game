const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const gameTitle = document.getElementById("game-title");
const muteBtn = document.getElementById("muteBtn");

let gameStarted = false;
let gameOver = false;
let score = 0;
let gameSpeed = 4;
let gravity = 1.8;
let frameCount = 0;
let isMuted = false;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Sound loading
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};
sounds.game.loop = true;

function playSound(name) {
  if (!isMuted && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

muteBtn.onclick = () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.game.pause();
  else sounds.game.play();
};

class Player {
  constructor() {
    this.sprite = new Image();
    this.sprite.src = "assets/player/run/sprite.png";
    this.x = 80;
    this.y = 0;
    this.width = 64;
    this.height = 64;
    this.dy = 0;
    this.frame = 0;
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;
    if (this.y + this.height >= canvas.height - 60) {
      this.y = canvas.height - 60 - this.height;
      this.dy = 0;
    }
    this.frame = (this.frame + 1) % 20;
  }

  jump() {
    if (this.y >= canvas.height - this.height - 60) {
      this.dy = -22;
      playSound("jump");
    }
  }

  draw() {
    ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
  }
}

class GameObject {
  constructor(src, size) {
    this.img = new Image();
    this.img.src = src;
    this.width = size;
    this.height = size;
    this.x = canvas.width + Math.random() * 400;
    this.y = canvas.height - size - 60;
    this.markedForDeletion = false;
  }

  update() {
    this.x -= gameSpeed;
    if (this.x + this.width < 0) this.markedForDeletion = true;
  }

  draw() {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  collides(player) {
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
  let img = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(img, 40));
}

function spawnObstacle() {
  let img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(img, 55));
}

function drawScore() {
  ctx.fillStyle = "gold";
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 48px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
}

function resetGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  gameSpeed = 4;
  collectibles.length = 0;
  obstacles.length = 0;
  player.y = canvas.height - player.height - 60;
  player.dy = 0;
  playSound("start");
  sounds.game.currentTime = 0;
  sounds.game.play();

  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
}

function gameLoop() {
  if (!gameStarted) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  player.update();
  player.draw();

  if (frameCount % 140 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      score += 10;
      playSound("collect");
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player)) {
      gameOver = true;
      playSound("death");
    }
  });

  collectibles.filter(c => !c.markedForDeletion);
  obstacles.filter(o => !o.markedForDeletion);

  drawScore();

  if (!gameOver) {
    frameCount++;
    requestAnimationFrame(gameLoop);
  } else {
    drawGameOver();
    startBtn.style.display = "block";
    startBtn.textContent = "Restart Game";
    letsShopBtn.style.display = "block";
    gameTitle.style.display = "block";
    sounds.game.pause();
  }
}

startBtn.addEventListener("click", () => {
  if (!gameStarted || gameOver) {
    resetGame();
    gameLoop();
  }
});

window.addEventListener("keydown", e => {
  if (e.code === "Space") player.jump();
});
window.addEventListener("touchstart", () => player.jump());

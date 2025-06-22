const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Buttons
const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");
const gameTitle = document.getElementById("game-title");

let isMuted = false;
let gameStarted = false;
let gameOver = false;
let score = 0;
let frameCount = 0;
let gameSpeed = 4;
let gravity = 1.2;

// 🔊 Sound setup
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  game: new Audio("assets/sound/game.wav"),
};

sounds.game.loop = true;

function toggleMute() {
  isMuted = !isMuted;
  for (let key in sounds) {
    sounds[key].muted = isMuted;
  }
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
}
muteBtn.addEventListener("click", toggleMute);

// 🎮 Resize canvas inside frame
function resizeCanvas() {
  const frame = document.getElementById("game-frame");
  if (!frame) return;
  canvas.width = frame.clientWidth;
  canvas.height = frame.clientHeight;
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

// 🎞️ Sprite Sheet Animation Helper
class SpriteAnimation {
  constructor(imageSrc, frameCols, frameRows, speed = 5) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.cols = frameCols;
    this.rows = frameRows;
    this.speed = speed;
    this.currentFrame = 0;
    this.frameTimer = 0;

    this.frameWidth = 0;
    this.frameHeight = 0;

    this.image.onload = () => {
      this.frameWidth = this.image.width / this.cols;
      this.frameHeight = this.image.height / this.rows;
    };
  }

  update() {
    this.frameTimer++;
    if (this.frameTimer >= this.speed) {
      this.currentFrame = (this.currentFrame + 1) % (this.cols * this.rows);
      this.frameTimer = 0;
    }
  }

  draw(ctx, x, y, scale = 2, flip = false) {
    const col = this.currentFrame % this.cols;
    const row = Math.floor(this.currentFrame / this.cols);
    const fw = this.frameWidth;
    const fh = this.frameHeight;

    ctx.save();
    if (flip) {
      ctx.translate(x + fw * scale, y);
      ctx.scale(-1, 1);
      x = 0;
    }
    ctx.drawImage(
      this.image,
      col * fw,
      row * fh,
      fw,
      fh,
      x,
      y,
      fw * scale,
      fh * scale
    );
    ctx.restore();
  }
}

// 🧍 Player Class
class Player {
  constructor() {
    this.scale = 1.6;
    this.x = 100;
    this.y = 0;
    this.dy = 0;
    this.jumpPower = -20;
    this.grounded = false;
    this.state = "run";

    this.animations = {
      run: new SpriteAnimation("assets/player/run/sprite.png", 5, 4, 4),
      jump: new SpriteAnimation("assets/player/jump/sprite.png", 6, 4, 4),
      death: new SpriteAnimation("assets/player/death/sprite.png", 6, 5, 6),
      idle: new SpriteAnimation("assets/player/idle/sprite.png", 4, 4, 6),
    };
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    const groundLevel = canvas.height - this.getHeight() - 40;
    if (this.y >= groundLevel) {
      this.y = groundLevel;
      this.dy = 0;
      this.grounded = true;
      if (this.state === "jump") this.state = "run";
    } else {
      this.grounded = false;
    }
  }

  getWidth() {
    const anim = this.animations[this.state];
    return anim.frameWidth * this.scale;
  }

  getHeight() {
    const anim = this.animations[this.state];
    return anim.frameHeight * this.scale;
  }

  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.state = "jump";
      if (!isMuted) sounds.jump.play();
    }
  }

  draw() {
    const anim = this.animations[this.state];
    anim.update();
    anim.draw(ctx, this.x, this.y, this.scale, true); // Flipped to face right ➡️
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
      player.x + player.getWidth() < this.x ||
      player.y > this.y + this.height ||
      player.y + player.getHeight() < this.y
    );
  }
}

const player = new Player();

const collectibles = [];
const obstacles = [];

const collectibleImages = [
  "assets/images/dress.png",
  "assets/images/handbag.png",
  "assets/images/heels.png",
  "assets/images/earing.png",
];

const obstacleImages = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

function spawnCollectible() {
  const src = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(src, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const src = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(src, 60, 60, gameSpeed));
}

function drawScore() {
  ctx.font = "24px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.textAlign = "center";
  ctx.font = "bold 42px Cinzel Decorative";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 50);
}

function resetGame() {
  score = 0;
  gameSpeed = 4;
  frameCount = 0;
  player.y = canvas.height - player.getHeight() - 40;
  player.dy = 0;
  player.state = "run";
  gameOver = false;
  collectibles.length = 0;
  obstacles.length = 0;
  sounds.game.currentTime = 0;
  if (!isMuted) sounds.game.play();
  gameLoop();
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

  if (frameCount % 130 === 0) spawnCollectible();
  if (frameCount % 200 === 0) spawnObstacle();

  collectibles.forEach((item, i) => {
    item.update();
    item.draw();
    if (item.collidesWith(player)) {
      score += 10;
      if (!isMuted) sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((obs, i) => {
    obs.update();
    obs.draw();
    if (obs.collidesWith(player)) {
      player.state = "death";
      gameOver = true;
      if (!isMuted) sounds.death.play();
    }
  });

  collectibles.filter(obj => !obj.markedForDeletion);
  obstacles.filter(obj => !obj.markedForDeletion);

  if (frameCount % 500 === 0) gameSpeed += 0.3;

  drawScore();

  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Input handling
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});
window.addEventListener("touchstart", () => player.jump());

canvas.addEventListener("click", () => {
  if (gameOver) resetGame();
});

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    resetGame();
    if (!isMuted) sounds.start.play();
    gameTitle.style.display = "none";
    startBtn.style.display = "none";
    letsShopBtn.style.display = "none";
  }
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const gameTitle = document.getElementById("game-title");
const muteBtn = document.getElementById("mute-btn");

let isMuted = false;
let gameStarted = false;
let gameOver = false;
let score = 0;
let gameSpeed = 4;
let gravity = 1.2;
let frameCount = 0;

let bgX = 0;
const bg = new Image();
bg.src = "assets/images/bg.jpg";

function resizeCanvas() {
  const container = document.getElementById("game-container");
  if (!container) return;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

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

function playSound(sound) {
  if (!isMuted) sound.play();
}

// Mute toggle
muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
  if (isMuted) {
    Object.values(sounds).forEach((s) => (s.muted = true));
  } else {
    Object.values(sounds).forEach((s) => (s.muted = false));
  }
});

class SpriteAnimation {
  constructor(imagePath, framesX, framesY, frameSpeed = 5) {
    this.image = new Image();
    this.image.src = imagePath;
    this.framesX = framesX;
    this.framesY = framesY;
    this.frameSpeed = frameSpeed;
    this.frameIndex = 0;
    this.tick = 0;
    this.frameWidth = 0;
    this.frameHeight = 0;
    this.loaded = false;

    this.image.onload = () => {
      this.frameWidth = this.image.width / this.framesX;
      this.frameHeight = this.image.height / this.framesY;
      this.loaded = true;
    };
  }

  update() {
    this.tick++;
    if (this.tick > this.frameSpeed) {
      this.tick = 0;
      this.frameIndex = (this.frameIndex + 1) % (this.framesX * this.framesY);
    }
  }

  draw(ctx, x, y, scale = 2) {
    if (!this.loaded) return;
    const fx = this.frameIndex % this.framesX;
    const fy = Math.floor(this.frameIndex / this.framesX);
    ctx.drawImage(
      this.image,
      fx * this.frameWidth,
      fy * this.frameHeight,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth * scale,
      this.frameHeight * scale
    );
  }
}

const animations = {
  idle: new SpriteAnimation("assets/player/idle/sprite.png", 4, 4),
  run: new SpriteAnimation("assets/player/run/sprite.png", 5, 4),
  jump: new SpriteAnimation("assets/player/jump/sprite.png", 6, 4),
  death: new SpriteAnimation("assets/player/death/sprite.png", 6, 5),
};

class Player {
  constructor() {
    this.x = 100;
    this.y = 0;
    this.width = 64;
    this.height = 64;
    this.dy = 0;
    this.jumpPower = -20;
    this.state = "idle";
    this.grounded = false;
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    const ground = canvas.height - this.height - 40;
    if (this.y > ground) {
      this.y = ground;
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
      this.grounded = false;
      playSound(sounds.jump);
    }
  }

  draw() {
    animations[this.state].update();
    animations[this.state].draw(ctx, this.x, this.y, 2);
  }
}

class GameObject {
  constructor(imageSrc, width, height, speed) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.width = width;
    this.height = height;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - this.height - 40;
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
      player.x + player.width < this.x ||
      player.x > this.x + this.width ||
      player.y + player.height < this.y ||
      player.y > this.y + this.height
    );
  }
}

const player = new Player();
player.y = canvas.height - player.height - 40;

const collectibles = [
  "assets/images/dress.png",
  "assets/images/handbag.png",
  "assets/images/heels.png",
  "assets/images/earing.png",
];
const obstacles = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

let gameObjects = [];

function spawnObjects() {
  if (frameCount % 120 === 0) {
    const isObstacle = Math.random() < 0.5;
    const src = isObstacle
      ? obstacles[Math.floor(Math.random() * obstacles.length)]
      : collectibles[Math.floor(Math.random() * collectibles.length)];

    const obj = new GameObject(src, 40, 40, gameSpeed);
    obj.isCollectible = !isObstacle;
    gameObjects.push(obj);
  }
}

function drawBackground() {
  bgX -= gameSpeed / 2;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

function drawScore() {
  ctx.fillStyle = "gold";
  ctx.font = "24px Cinzel Decorative, cursive";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "32px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap or Press Space to Try Again", canvas.width / 2, canvas.height / 2 + 60);
}

function resetGame() {
  gameObjects = [];
  gameOver = false;
  score = 0;
  frameCount = 0;
  gameSpeed = 4;
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  playSound(sounds.game);
  gameLoop();
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  player.update();
  player.draw();
  spawnObjects();

  gameObjects.forEach((obj, index) => {
    obj.update();
    obj.draw();

    if (obj.collidesWith(player)) {
      if (obj.isCollectible) {
        score += 10;
        playSound(sounds.collect);
        gameObjects.splice(index, 1);
      } else {
        gameOver = true;
        player.state = "death";
        playSound(sounds.death);
        sounds.game.pause();
      }
    }
  });

  gameObjects = gameObjects.filter((o) => !o.markedForDeletion);

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

function startGame() {
  gameStarted = true;
  gameOver = false;
  player.state = "run";
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  playSound(sounds.start);
  playSound(sounds.game);
  gameLoop();
}

function restartGame() {
  if (gameOver) {
    resetGame();
  }
}

startBtn.addEventListener("click", () => {
  if (!gameStarted) startGame();
  else restartGame();
});
letsShopBtn.addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    if (gameOver) restartGame();
    else player.jump();
  }
});
window.addEventListener("touchstart", () => {
  if (gameOver) restartGame();
  else player.jump();
});

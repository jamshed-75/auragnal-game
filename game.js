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

for (let key in sounds) sounds[key].volume = 1;
sounds.game.loop = true;

function playSound(name) {
  if (!isMuted && sounds[name]) sounds[name].play();
}

function toggleMute() {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.game.pause();
  else sounds.game.play();
}
muteBtn.onclick = toggleMute;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// Background
const bg = new Image();
bg.src = "assets/images/bg.jpg";

let bgX = 0;

// Animation class with custom rows/cols
class SpriteAnimation {
  constructor(src, columns, rows) {
    this.image = new Image();
    this.image.src = src;
    this.columns = columns;
    this.rows = rows;
    this.totalFrames = columns * rows;
    this.currentFrame = 0;
    this.frameSpeed = 5;
    this.timer = 0;
  }

  update() {
    this.timer++;
    if (this.timer >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
      this.timer = 0;
    }
  }

  draw(ctx, x, y, scale = 2) {
    const frameWidth = this.image.width / this.columns;
    const frameHeight = this.image.height / this.rows;
    const col = this.currentFrame % this.columns;
    const row = Math.floor(this.currentFrame / this.columns);
    ctx.drawImage(
      this.image,
      col * frameWidth,
      row * frameHeight,
      frameWidth,
      frameHeight,
      x,
      y,
      frameWidth * scale,
      frameHeight * scale
    );
  }
}

const playerAnimations = {
  idle: new SpriteAnimation("assets/player/idle/sprite.png", 4, 4),
  run: new SpriteAnimation("assets/player/run/sprite.png", 5, 4),
  jump: new SpriteAnimation("assets/player/jump/sprite.png", 6, 4),
  death: new SpriteAnimation("assets/player/death/sprite.png", 6, 5),
};

class Player {
  constructor() {
    this.x = 100;
    this.y = 0;
    this.dy = 0;
    this.state = "idle";
    this.width = 80;
    this.height = 100;
    this.jumpPower = -22;
    this.grounded = false;
  }

  update() {
    this.dy += 1.2;
    this.y += this.dy;
    const ground = canvas.height - this.height - 40;
    if (this.y >= ground) {
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
      playSound("jump");
    }
  }

  draw() {
    playerAnimations[this.state].update();
    playerAnimations[this.state].draw(ctx, this.x, this.y, 2);
  }
}

class GameObject {
  constructor(src, w, h) {
    this.image = new Image();
    this.image.src = src;
    this.width = w;
    this.height = h;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - h - 40;
    this.speed = 6;
    this.marked = false;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.width < 0) this.marked = true;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collides(p) {
    return !(
      p.x > this.x + this.width ||
      p.x + p.width < this.x ||
      p.y > this.y + this.height ||
      p.y + p.height < this.y
    );
  }
}

const player = new Player();
let collectibles = [];
let obstacles = [];
let gameOver = false;
let frame = 0;
let score = 0;

const collectibleAssets = [
  "assets/images/dress.png",
  "assets/images/handbag.png",
  "assets/images/earings.png",
  "assets/images/heels.png",
];

const obstacleAssets = [
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_hanger.png",
];

function spawn() {
  if (frame % 140 === 0) {
    collectibles.push(new GameObject(collectibleAssets[Math.floor(Math.random() * collectibleAssets.length)], 50, 50));
  }
  if (frame % 180 === 0) {
    obstacles.push(new GameObject(obstacleAssets[Math.floor(Math.random() * obstacleAssets.length)], 60, 60));
  }
}

function drawBackground() {
  ctx.drawImage(bg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, bgX + canvas.width, 0, canvas.width, canvas.height);
  bgX -= 2;
  if (bgX <= -canvas.width) bgX = 0;
}

function drawScore() {
  ctx.font = "24px Cinzel Decorative";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function resetGame() {
  gameOver = false;
  score = 0;
  frame = 0;
  player.y = canvas.height - player.height - 40;
  player.state = "run";
  collectibles = [];
  obstacles = [];
  playSound("start");
  sounds.game.currentTime = 0;
  sounds.game.play();
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  requestAnimationFrame(gameLoop);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 42px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 60);
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
  spawn();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      playSound("collect");
      score += 10;
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player)) {
      playSound("death");
      gameOver = true;
    }
  });

  collectibles = collectibles.filter(c => !c.marked);
  obstacles = obstacles.filter(o => !o.marked);
  drawScore();
  frame++;
  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});

canvas.addEventListener("touchstart", () => player.jump());
canvas.addEventListener("click", () => {
  if (gameOver) resetGame();
});

startBtn.onclick = () => {
  resetGame();
};

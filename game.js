const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let gameStarted = false;
let score = 0;
let gravity = 1.5;
let frameCount = 0;
let gameSpeed = 5;
let gameOver = false;
let isMuted = false;

canvas.width = 1280;
canvas.height = 720;

// Background
const backgroundImg = new Image();
backgroundImg.src = "assets/images/bg.jpg";
let bgX = 0;

// Sounds
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};
Object.values(sounds).forEach(sound => sound.volume = 0.8);
sounds.game.loop = true;

// Mute toggle
muteBtn.onclick = () => {
  isMuted = !isMuted;
  Object.values(sounds).forEach(s => s.muted = isMuted);
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
};

// Player Animation using sprite sheet (5x4)
class Sprite {
  constructor(src, framesX, framesY) {
    this.image = new Image();
    this.image.src = src;
    this.framesX = framesX;
    this.framesY = framesY;
    this.frame = 0;
    this.tick = 0;
    this.maxFrames = framesX * framesY;
    this.frameWidth = 64;
    this.frameHeight = 64;
  }

  update() {
    this.tick++;
    if (this.tick % 5 === 0) {
      this.frame = (this.frame + 1) % this.maxFrames;
    }
  }

  draw(x, y, scale = 2) {
    const fx = this.frame % this.framesX;
    const fy = Math.floor(this.frame / this.framesX);
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
  run: new Sprite("assets/player/run/sprite.png", 5, 4),
  jump: new Sprite("assets/player/jump/sprite.png", 6, 4),
  idle: new Sprite("assets/player/idle/sprite.png", 4, 4),
  death: new Sprite("assets/player/death/sprite.png", 6, 5),
};

class Player {
  constructor() {
    this.width = 64 * 2;
    this.height = 64 * 2;
    this.x = 150;
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
    animations[this.state].update();
    animations[this.state].draw(this.x, this.y);
  }
}

class GameObject {
  constructor(src, w, h, speed) {
    this.image = new Image();
    this.image.src = src;
    this.x = canvas.width;
    this.y = canvas.height - h - 40;
    this.width = w;
    this.height = h;
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

function spawnCollectible() {
  const img = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(img, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const img = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(img, 60, 60, gameSpeed));
}

function drawBackground() {
  bgX -= gameSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(backgroundImg, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, bgX + canvas.width, 0, canvas.width, canvas.height);
}

function drawScore() {
  ctx.font = "bold 28px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 8;
  ctx.fillText(`Score: ${score}`, 30, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 40px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
  ctx.fillText("Tap to Try Again", canvas.width / 2, canvas.height / 2 + 60);
}

function resetGame() {
  score = 0;
  gameSpeed = 5;
  gameOver = false;
  frameCount = 0;
  collectibles = [];
  obstacles = [];
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  gameTitle.style.display = "none";
  sounds.game.currentTime = 0;
  sounds.game.play();
  animate();
}

function animate() {
  if (gameOver) {
    drawGameOver();
    sounds.game.pause();
    sounds.death.play();
    canvas.addEventListener("click", resetGame, { once: true });
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  player.update();
  player.draw();

  if (frameCount % 120 === 0) spawnCollectible();
  if (frameCount % 160 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      score += 10;
      sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player)) {
      player.state = "death";
      gameOver = true;
    }
  });

  collectibles = collectibles.filter(c => !c.marked);
  obstacles = obstacles.filter(o => !o.marked);

  drawScore();

  frameCount++;
  requestAnimationFrame(animate);
}

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});
window.addEventListener("touchstart", () => player.jump());

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    player.state = "run";
    sounds.start.play();
    resetGame();
  }
});

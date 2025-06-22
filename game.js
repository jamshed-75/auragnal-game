const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const container = document.getElementById("game-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", () => {
  resizeCanvas();
});

const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const gameTitle = document.getElementById("game-title");
const muteBtn = document.getElementById("muteBtn");

let gameStarted = false;
let isMuted = false;
let score = 0;
let gameSpeed = 5;
let gravity = 1.5;
let frameCount = 0;
let gameOver = false;

// Load sounds
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};

Object.values(sounds).forEach(s => (s.volume = 0.5));
sounds.game.loop = true;

// Spritesheets config
const playerSprites = {
  run: { src: "assets/player/run/sprite.png", frames: 20, columns: 5, rows: 4 },
  jump: { src: "assets/player/jump/sprite.png", frames: 24, columns: 6, rows: 4 },
  idle: { src: "assets/player/idle/sprite.png", frames: 16, columns: 4, rows: 4 },
  death: { src: "assets/player/death/sprite.png", frames: 30, columns: 6, rows: 5 },
};

class Animation {
  constructor({ src, frames, columns, rows }) {
    this.image = new Image();
    this.image.src = src;
    this.frames = frames;
    this.columns = columns;
    this.rows = rows;
    this.frameIndex = 0;
    this.frameSpeed = 4;
    this.timer = 0;
  }

  update() {
    this.timer++;
    if (this.timer >= this.frameSpeed) {
      this.frameIndex = (this.frameIndex + 1) % this.frames;
      this.timer = 0;
    }
  }

  draw(ctx, x, y, scale = 2) {
    const fw = this.image.width / this.columns;
    const fh = this.image.height / this.rows;
    const col = this.frameIndex % this.columns;
    const row = Math.floor(this.frameIndex / this.columns);

    ctx.drawImage(
      this.image,
      col * fw, row * fh, fw, fh,
      x, y, fw * scale, fh * scale
    );
  }
}

const playerAnimations = {
  run: new Animation(playerSprites.run),
  jump: new Animation(playerSprites.jump),
  idle: new Animation(playerSprites.idle),
  death: new Animation(playerSprites.death),
};

class Player {
  constructor() {
    this.state = "idle";
    this.scale = 1.5;
    this.x = canvas.width * 0.1;
    this.y = 0;
    this.dy = 0;
    this.jumpPower = -22;
    this.grounded = false;

    this.width = 0;
    this.height = 0;
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    const groundY = canvas.height - this.getHeight() - 40;

    if (this.y >= groundY) {
      this.y = groundY;
      this.dy = 0;
      this.grounded = true;
      if (this.state === "jump") this.state = "run";
    } else {
      this.grounded = false;
    }

    if (!this.width) {
      this.width = this.getWidth();
      this.height = this.getHeight();
    }
  }

  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.grounded = false;
      this.state = "jump";
      if (!isMuted) sounds.jump.play();
    }
  }

  draw() {
    const anim = playerAnimations[this.state];
    anim.update();
    anim.draw(ctx, this.x, this.y, this.scale);
  }

  getWidth() {
    const anim = playerAnimations[this.state];
    return (anim.image.width / anim.columns) * this.scale;
  }

  getHeight() {
    const anim = playerAnimations[this.state];
    return (anim.image.height / anim.rows) * this.scale;
  }
}

class GameObject {
  constructor(src, width, height, speed) {
    this.image = new Image();
    this.image.src = src;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - height - 40;
    this.width = width;
    this.height = height;
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
      player.x + 20 > this.x + this.width ||
      player.x + player.width - 20 < this.x ||
      player.y + 20 > this.y + this.height ||
      player.y + player.height - 20 < this.y
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
  const src = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(src, 50, 50, gameSpeed));
}

function spawnObstacle() {
  const src = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(src, 60, 60, gameSpeed));
}

function drawScore() {
  ctx.font = "bold 24px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 30, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 42px Cinzel Decorative, cursive";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 30);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
  ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 50);
}

function resetGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 5;
  frameCount = 0;
  collectibles = [];
  obstacles = [];
  player.y = canvas.height - player.height - 40;
  player.state = "run";
  if (!isMuted) sounds.game.play();
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

  if (frameCount % 160 === 0) spawnCollectible();
  if (frameCount % 240 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collidesWith(player)) {
      score += 10;
      if (!isMuted) sounds.collect.play();
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collidesWith(player)) {
      gameOver = true;
      if (!isMuted) sounds.death.play();
    }
  });

  collectibles = collectibles.filter(c => !c.markedForDeletion);
  obstacles = obstacles.filter(o => !o.markedForDeletion);

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

function handleJump() {
  if (gameOver) {
    resetGame();
    return;
  }
  player.jump();
}

startBtn.addEventListener("click", () => {
  gameStarted = true;
  gameTitle.style.display = "none";
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
  player.state = "run";
  if (!isMuted) sounds.start.play();
  if (!isMuted) sounds.game.play();
  resetGame();
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") handleJump();
});
window.addEventListener("touchstart", handleJump);

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  sounds.game.volume = isMuted ? 0 : 0.5;
});

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameSpeed = 4;
let frameCount = 0;
let score = 0;
let gameStarted = false;
let gameOver = false;
let isMuted = false;

const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png"; // 6120x1440 background
const BG_WIDTH = 6120;
let bgX = 0;

// 🎵 Sound Setup
// (keep your existing sounds setup and mute logic)

const cartFrames = [
  "cart_empty.png",
  "cart_partial.png",
  "cart_full.png",
  "cart_broken.png"
].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

class Player {
  constructor() {
    this.frameWidth = 56;
    this.frameHeight = 56;
    this.scale = 1.2;
    this.x = 80;
    this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -18;
    this.grounded = true;
    this.isDead = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameSpeed = 15;
  }

  update() {
    this.dy += 1.2; // gravity
    this.y += this.dy;

    if (this.y + this.frameHeight * this.scale >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }

    this.frameTimer++;
    if (this.frameTimer >= this.frameSpeed) {
      this.currentFrame = (this.currentFrame + 1) % 3;
      this.frameTimer = 0;
    }
  }

  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
      this.grounded = false;
    }
  }

  draw() {
    const img = cartFrames[this.isDead ? 3 : score >= 30 ? 2 : score >= 10 ? 1 : 0];
    if (img.complete) {
      ctx.drawImage(
        img,
        0,
        0,
        this.frameWidth,
        this.frameHeight,
        this.x,
        this.y,
        this.frameWidth * this.scale,
        this.frameHeight * this.scale
      );
    }
  }

  die() {
    this.isDead = true;
  }
}

class GameObject {
  constructor(imgSrc, width, height) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = CANVAS_WIDTH + Math.random() * 300 + 200;
    this.y = CANVAS_HEIGHT - height - 40;
    this.marked = false;
  }

  update() {
    this.x -= gameSpeed;
    if (this.x + this.width < 0) this.marked = true;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collides(player) {
    return !(
      player.x + 10 > this.x + this.width - 10 ||
      player.x + player.frameWidth * player.scale - 10 < this.x + 10 ||
      player.y + 10 > this.y + this.height - 10 ||
      player.y + player.frameHeight * player.scale - 10 < this.y + 10
    );
  }
}

// Game variables
const player = new Player();
let collectibles = [];
let obstacles = [];

const collectibleImgs = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earing.png"
];
const obstacleImgs = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png"
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 32, 32));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 40, 40));
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -BG_WIDTH) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, BG_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + BG_WIDTH, 0, BG_WIDTH, CANVAS_HEIGHT);
}

function drawScore() {
  ctx.font = "20px Cinzel Decorative";
  ctx.fillStyle = "#588749";
  ctx.fillText(`Score: ${score}`, 40, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#588749";
  ctx.font = "28px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  ctx.fillText("Press Start or Tap to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function resetGame() {
  score = 0;
  gameOver = false;
  player.y = CANVAS_HEIGHT - player.frameHeight * player.scale - 40;
  player.dy = 0;
  player.isDead = false;
  collectibles = [];
  obstacles = [];
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    return;
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();

  player.update();
  player.draw();

  if (frameCount % 160 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      score += 10;
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player) && !player.isDead) {
      player.die();
      setTimeout(() => (gameOver = true), 1000);
    }
  });

  collectibles = collectibles.filter((c) => !c.marked);
  obstacles = obstacles.filter((o) => !o.marked);

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Controls
document.getElementById("startBtn").addEventListener("click", () => {
  if (!gameStarted) gameStarted = true;
  resetGame();
});

document.getElementById("lets-shop").addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});

["keydown", "mousedown", "touchstart"].forEach((event) => {
  window.addEventListener(event, () => {
    if (gameOver) resetGame();
    else player.jump();
  });
});

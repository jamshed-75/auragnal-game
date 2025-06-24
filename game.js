const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let gameStarted = false;
let gameOver = false;
let isMuted = false;
let score = 0;
let frameCount = 0;
let gameSpeed = 4;

const gravity = 1.2;
const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Setup Canvas
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Load Sounds
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  game: new Audio("assets/sound/game.wav"),
};
sounds.game.loop = true;

function playSound(sound) {
  if (!isMuted) {
    sounds[sound].currentTime = 0;
    sounds[sound].play();
  }
}

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.game.pause();
  else if (gameStarted) sounds.game.play();
});

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg_loop.png"; // your 6120x1440 futuristic background
let bgX = 0;

// Cart Character Frames
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
    this.frameWidth = 256; // Actual image size
    this.frameHeight = 256;
    this.scale = 0.35; // Tweak this down if still too big
    this.x = 60;
    this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -28;
    this.grounded = true;
    this.isDead = false;
    this.state = 0; // 0=empty, 1=partial, 2=full, 3=broken

    this.cartFrames = [
      "assets/cart/cart_empty.png",
      "assets/cart/cart_partial.png",
      "assets/cart/cart_full.png",
      "assets/cart/cart_broken.png"
    ].map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.frameHeight * this.scale >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
      this.grounded = false;
      playSound("jump");
    }
  }

  draw() {
    const img = this.cartFrames[this.state];
    if (!img.complete) return;

    ctx.drawImage(
      img,
      0, 0,
      this.frameWidth,
      this.frameHeight,
      this.x,
      this.y,
      this.frameWidth * this.scale,
      this.frameHeight * this.scale
    );
  }

  die() {
    this.state = 3;
    this.isDead = true;
  }
}
  draw() {
    const img = cartFrames[this.state];
    if (!img.complete) return;

    const width = img.width * this.scale;
    const height = img.height * this.scale;

    ctx.drawImage(img, this.x, this.y, width, height);
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
    const px = player.x, py = player.y;
    const pw = cartFrames[player.state].width * player.scale;
    const ph = cartFrames[player.state].height * player.scale;

    return !(
      px > this.x + this.width ||
      px + pw < this.x ||
      py > this.y + this.height ||
      py + ph < this.y
    );
  }
}

const player = new Player();
let collectibles = [];
let obstacles = [];

const collectibleImgs = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earing.png",
];

const obstacleImgs = [
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
  "assets/images/obstacle_cart.png"
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 40, 40)); // smaller size
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 44, 44)); // smaller size
}

function drawBackground() {
  const scrollSpeed = gameSpeed * 0.6;
  bgX -= scrollSpeed;
  if (bgX <= -bgImage.width) bgX = 0;

  ctx.drawImage(bgImage, bgX, 0, bgImage.width, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, CANVAS_HEIGHT);
}

function drawScore() {
  ctx.font = "20px Cinzel Decorative";
  ctx.fillStyle = "#588749";
  ctx.fillText(`Score: ${score}`, 30, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#588749";
  ctx.font = "32px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  ctx.fillText("Press Start to Try Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function resetGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 4;
  collectibles = [];
  obstacles = [];
  player.y = CANVAS_HEIGHT - 220;
  player.dy = 0;
  player.isDead = false;
  player.state = 0;
  playSound("game");
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  if (gameOver) {
    drawGameOver();
    sounds.game.pause();
    return;
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();

  player.update();
  player.draw();

  if (frameCount % 150 === 0) spawnCollectible();
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
    if (o.collides(player) && !player.isDead) {
      player.die();
      playSound("death");
      setTimeout(() => (gameOver = true), 800);
    }
  });

  collectibles = collectibles.filter(c => !c.marked);
  obstacles = obstacles.filter(o => !o.marked);

  drawScore();

  // Speed up as score increases
  if (score > 0 && score % 50 === 0) {
    gameSpeed = 4 + score / 100;
  }

  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    if (gameOver) resetGame();
    else player.jump();
  }
});

window.addEventListener("touchstart", () => {
  if (gameOver) resetGame();
  else player.jump();
});

window.addEventListener("mousedown", () => {
  if (gameOver) resetGame();
  else player.jump();
});

startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    playSound("start");
  }
  resetGame();
});

letsShopBtn.addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});

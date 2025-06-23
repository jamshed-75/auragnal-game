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
const gravity = 1.1;

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";
let bgX = 0;

// Sound
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
  isMuted ? sounds.game.pause() : sounds.game.play();
});

// Cart Images
const cartStates = {
  empty: "assets/cart/cart_empty.png",
  partial: "assets/cart/cart_partial.png",
  full: "assets/cart/cart_full.png",
  broken: "assets/cart/cart_broken.png",
};

// Load all cart images
const cartImages = {};
for (const [key, path] of Object.entries(cartStates)) {
  const img = new Image();
  img.src = path;
  cartImages[key] = img;
}

class Cart {
  constructor() {
    this.width = 100;
    this.height = 100;
    this.scale = 1.2;
    this.x = 80;
    this.y = CANVAS_HEIGHT - this.height * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -16;
    this.grounded = true;
    this.isBroken = false;
    this.state = "empty";
  }

  updateState() {
    if (this.isBroken) {
      this.state = "broken";
    } else if (score >= 50) {
      this.state = "full";
    } else if (score >= 20) {
      this.state = "partial";
    } else {
      this.state = "empty";
    }
  }

  update() {
    this.updateState();
    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.height * this.scale >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - this.height * this.scale - 40;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  jump() {
    if (this.grounded && !this.isBroken) {
      this.dy = this.jumpPower;
      this.grounded = false;
      playSound("jump");
    }
  }

  draw() {
    const img = cartImages[this.state];
    if (img.complete) {
      ctx.drawImage(
        img,
        this.x,
        this.y,
        this.width * this.scale,
        this.height * this.scale
      );
    }
  }

  break() {
    this.isBroken = true;
    this.state = "broken";
  }

  reset() {
    this.y = CANVAS_HEIGHT - this.height * this.scale - 40;
    this.dy = 0;
    this.isBroken = false;
    this.state = "empty";
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

  collides(cart) {
    return !(
      cart.x + 20 > this.x + this.width - 10 ||
      cart.x + cart.width * cart.scale - 20 < this.x + 10 ||
      cart.y + 20 > this.y + this.height - 10 ||
      cart.y + cart.height * cart.scale - 20 < this.y + 10
    );
  }
}

const cart = new Cart();
let collectibles = [];
let obstacles = [];

const collectibleImgs = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earing.png",
];
const obstacleImgs = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 40, 40));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 48, 48));
}

function drawScore() {
  ctx.font = "20px Cinzel Decorative, cursive";
  ctx.fillStyle = "#588749";
  ctx.fillText(`Score: ${score}`, 40, 40);
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -CANVAS_WIDTH) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#588749";
  ctx.font = "28px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Cart Crashed!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  ctx.fillText("Press Start to Retry", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function resetGame() {
  gameOver = false;
  gameSpeed = 4;
  score = 0;
  collectibles = [];
  obstacles = [];
  cart.reset();
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

  cart.update();
  cart.draw();

  if (frameCount % 160 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(cart)) {
      score += 10;
      playSound("collect");
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(cart) && !cart.isBroken) {
      cart.break();
      playSound("death");
      setTimeout(() => {
        gameOver = true;
      }, 1000);
    }
  });

  collectibles = collectibles.filter((c) => !c.marked);
  obstacles = obstacles.filter((o) => !o.marked);

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
    if (gameOver) resetGame();
    else cart.jump();
  }
});

window.addEventListener("mousedown", () => {
  if (gameOver) resetGame();
  else cart.jump();
});

window.addEventListener("touchstart", () => {
  if (gameOver) resetGame();
  else cart.jump();
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

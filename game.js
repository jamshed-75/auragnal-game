const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const gameTitle = document.getElementById("game-title");
const muteBtn = document.getElementById("muteBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const jumpBtn = document.getElementById("jumpBtn");
const stopBtn = document.getElementById("stopBtn");

let gameStarted = false;
let gameOver = false;
let isMuted = false;
let score = 0;
let highestScore = localStorage.getItem('highestScore') || 0;
let frameCount = 0;
let gameSpeed = 4;
let cartScale = 1.5;
let backgroundX = 0;

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

// Set canvas size
function setupCanvas() {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}
setupCanvas();

// Sounds
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
bgImage.src = "assets/images/bg_loop.png";
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
    this.frameWidth = 56;
    this.frameHeight = 56;
    this.x = 60;
    this.y = CANVAS_HEIGHT - this.frameHeight * cartScale - 20;
    this.dy = 0;
    this.jumpPower = -28;
    this.grounded = true;
    this.isDead = false;
    this.state = 0; // 0=empty, 1=partial, 2=full, 3=broken
    this.cartFrames = loadFrames("cart", 4, "cart");
  }

  update() {
    if (this.isDead) {
      this.state = 3; // broken
    } else if (!this.grounded) {
      this.state = 2; // full cart
    } else {
      this.state = 0; // empty cart
    }

    this.dy += gravity;
    this.y += this.dy;

    if (this.y + this.frameHeight * cartScale >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - this.frameHeight * cartScale - 40;
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

  die() {
    this.isDead = true;
    this.state = 3; // broken cart
  }

  draw() {
    const img = this.cartFrames[this.state];
    if (!img.complete) return;

    const width = img.width * cartScale;
    const height = img.height * cartScale;

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
    const playerPaddingX = 18;
    const playerPaddingY = 12;
    const obstaclePaddingX = 12;
    const obstaclePaddingY = 12;

    return !(
      player.x + playerPaddingX > this.x + this.width - obstaclePaddingX ||
      player.x + player.frameWidth * player.scale - playerPaddingX < this.x + obstaclePaddingX ||
      player.y + playerPaddingY > this.y + this.height - obstaclePaddingY ||
      player.y + player.frameHeight * player.scale - playerPaddingY < this.y + obstaclePaddingY
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
  "assets/images/obstacle_hanger.png",
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 48, 48));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 56, 56));
}

function drawScore() {
  ctx.font = "20px Cinzel Decorative, cursive";
  ctx.fillStyle = "#588749";
  let x = window.innerWidth < 500 ? 60 : 40;
  ctx.fillText(`Score: ${score}`, x, 40);
  ctx.fillText(`Highest Score: ${highestScore}`, 40, 80);
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -CANVAS_WIDTH) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#588749";
  ctx.font = "32px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  ctx.fillText("Tap or Press Start to Try Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function resetGame() {
  gameOver = false;
  gameSpeed = 4;
  score = 0;
  collectibles = [];
  obstacles = [];
  player.y = CANVAS_HEIGHT - player.frameHeight * cartScale - 40;
  player.dy = 0;
  player.isDead = false;
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

  if (frameCount % 160 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

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
      setTimeout(() => {
        gameOver = true;
      }, 1000);
    }
  });

  collectibles = collectibles.filter((c) => !c.marked);
  obstacles = obstacles.filter((o) => !o.marked);

  drawScore();
  frameCount++;

  if (score % 50 === 0) gameSpeed += 0.5;

  requestAnimationFrame(gameLoop);
}

// Controls
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
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

tryAgainBtn.addEventListener("click", resetGame);
jumpBtn.addEventListener("click", player.jump.bind(player));
stopBtn.addEventListener("click", () => {
  gameSpeed = 0; // pause the game temporarily for obstacles to fall
});

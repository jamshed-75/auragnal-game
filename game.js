const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let gameStarted = false;
let gameOver = false;
let isMuted = false;
let score = 0;
let frameCount = 0;
let gameSpeed = 4;
const gravity = 1.2;

// Sounds
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  game: new Audio("assets/sound/game.wav"),
};
sounds.game.loop = true;

function playSound(name) {
  if (!isMuted) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg_long.jpg"; // your new 6120x1440 image
let bgX = 0;

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -bgImage.width) bgX = 0;

  ctx.drawImage(bgImage, bgX, 0, bgImage.width, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + bgImage.width, 0, bgImage.width, CANVAS_HEIGHT);
}

// Cart images
const cartImages = {
  empty: loadImage("assets/cart/cart_empty.png"),
  partial: loadImage("assets/cart/cart_partial.png"),
  full: loadImage("assets/cart/cart_full.png"),
  broken: loadImage("assets/cart/cart_broken.png"),
};

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

class Player {
  constructor() {
    this.state = "empty";
    this.width = 100;
    this.height = 80;
    this.scale = 1.2;
    this.x = 80;
    this.y = CANVAS_HEIGHT - this.height * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -18;
    this.grounded = true;
    this.hit = false;
  }

  update() {
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
    if (this.grounded && !this.hit) {
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

  resetState() {
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

  collides(player) {
    return !(
      player.x + player.width * player.scale < this.x ||
      player.x > this.x + this.width ||
      player.y + player.height * player.scale < this.y ||
      player.y > this.y + this.height
    );
  }
}

// Game Setup
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
  "assets/images/obstacle_rock.png",
  "assets/images/obstacle_hump.png",
];

function spawnCollectible() {
  const img = collectibleImgs[Math.floor(Math.random() * collectibleImgs.length)];
  collectibles.push(new GameObject(img, 40, 40));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 40, 40));
}

function drawScore() {
  ctx.font = "20px Cinzel Decorative";
  ctx.fillStyle = "#588749";
  ctx.fillText(`Score: ${score}`, 30, 40);
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
  player.resetState();
  player.hit = false;
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

  if (frameCount % 140 === 0) spawnCollectible();
  if (frameCount % 220 === 0) spawnObstacle();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      score += 10;
      if (score >= 50 && score % 50 === 0) gameSpeed += 0.5;

      if (score < 30) player.state = "partial";
      else player.state = "full";

      playSound("collect");
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player) && !player.hit) {
      player.state = "broken";
      player.hit = true;
      playSound("death");
      setTimeout(() => (gameOver = true), 1000);
    }
  });

  collectibles = collectibles.filter((c) => !c.marked);
  obstacles = obstacles.filter((o) => !o.marked);

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Events
document.getElementById("startBtn").addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    playSound("start");
  }
  resetGame();
});

document.getElementById("lets-shop").addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});

document.getElementById("muteBtn").addEventListener("click", () => {
  isMuted = !isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.game.pause();
  else if (gameStarted) sounds.game.play();
});

window.addEventListener("keydown", (e) => {
  if (["Space", "ArrowUp", "KeyW"].includes(e.code)) {
    if (gameOver) resetGame();
    else player.jump();
  }
});

window.addEventListener("touchstart", () => {
  if (gameOver) resetGame();
  else player.jump();
});

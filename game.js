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

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

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

function playSound(name) {
  if (!isMuted) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) {
    sounds.game.pause();
  } else if (gameStarted) {
    sounds.game.play();
  }
});

// Background
const bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";
let bgX = 0;

function loadFrames(folder, count, prefix) {
  const frames = [];
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.src = `assets/player/${folder}/${prefix}${i}.png`;
    frames.push(img);
  }
  return frames;
}

class Player {
  constructor() {
    this.frameWidth = 117;  // or actual width of frame
    this.frameHeight = 296; // or actual height
    this.scale = 0.35;      // Adjust this if character looks too big
    this.x = 80;
    this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40;
    this.dy = 0;
    this.jumpPower = -28;
    this.grounded = true;
    this.isDead = false;

    this.animations = {
      run: loadFrames("run", 4, "run"),
      jump: loadFrames("jump", 4, "jump"),
      death: loadFrames("death", 2, "death"),
      idle: loadFrames("idle", 3, "idle"),
    };

    this.currentAnimation = "run";
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameSpeed = 10;
  }

  update() {
    if (this.isDead) this.currentAnimation = "death";
    else if (!this.grounded) this.currentAnimation = "jump";
    else this.currentAnimation = "run";

    this.dy += gravity;
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
      this.currentFrame++;
      if (this.currentFrame >= this.animations[this.currentAnimation].length) {
        this.currentFrame = this.currentAnimation === "death"
          ? this.animations["death"].length - 1
          : 0;
      }
      this.frameTimer = 0;
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
    this.currentFrame = 0;
  }

  draw() {
    const img = this.animations[this.currentAnimation][this.currentFrame];
    if (!img.complete) return;

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

class GameObject {
  constructor(imgSrc, width, height) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.width = width;
    this.height = height;
    this.x = CANVAS_WIDTH + Math.random() * 300 + 300;
    this.y = CANVAS_HEIGHT - height - 40;
    this.marked = false;
  }

  update() {
    this.x -= gameSpeed;
    if (this.x + this.width < 0) this.marked = true;
  }

 draw() {
  const img = this.animations[this.currentAnimation][this.currentFrame];
  if (!img.complete) return;

  // Adjust scale and direction
  const drawWidth = this.frameWidth * this.scale;
  const drawHeight = this.frameHeight * this.scale;

  ctx.drawImage(
    img,
    0, 0,
    this.frameWidth,
    this.frameHeight,
    this.x,
    this.y,
    drawWidth,
    drawHeight
  );
}
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
  collectibles.push(new GameObject(img, 42, 42));
}

function spawnObstacle() {
  const img = obstacleImgs[Math.floor(Math.random() * obstacleImgs.length)];
  obstacles.push(new GameObject(img, 50, 50));
}

function drawBackground() {
  bgX -= gameSpeed * 0.5;
  if (bgX <= -CANVAS_WIDTH) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.drawImage(bgImage, bgX + CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
  ctx.font = "30px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  ctx.fillText(`Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  ctx.fillText("Tap or Press Start to Try Again", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function resetGame() {
  gameOver = false;
  gameSpeed = 4;
  score = 0;
  collectibles = [];
  obstacles = [];
  player.y = CANVAS_HEIGHT - player.frameHeight * player.scale - 40;
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
      }, 800);
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

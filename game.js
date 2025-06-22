const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const muteBtn = document.getElementById("muteBtn");
const letsShopBtn = document.getElementById("lets-shop");

let gameStarted = false;
let gameOver = false;
let isMuted = false;
let score = 0;
let frame = 0;
let gravity = 1.8;
let gameSpeed = 5;

const bg = new Image();
bg.src = "assets/images/bg.jpg";

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  game: new Audio("assets/sound/game.wav"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
};

sounds.game.loop = true;

function resizeCanvas() {
  const container = document.getElementById("game-frame");
  if (!container) return;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener("load", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

class Sprite {
  constructor(imgSrc, frameCols, frameRows) {
    this.image = new Image();
    this.image.src = imgSrc;
    this.cols = frameCols;
    this.rows = frameRows;
    this.frameW = 0;
    this.frameH = 0;
    this.frameIndex = 0;
    this.frameDelay = 5;
    this.counter = 0;
  }

  draw(ctx, x, y, scale = 2, flip = false) {
    if (this.image.complete) {
      if (this.frameW === 0) {
        this.frameW = this.image.width / this.cols;
        this.frameH = this.image.height / this.rows;
      }

      const col = this.frameIndex % this.cols;
      const row = Math.floor(this.frameIndex / this.cols);

      ctx.save();
      if (flip) {
        ctx.translate(x + this.frameW * scale, y);
        ctx.scale(-1, 1);
        x = 0;
      }

      ctx.drawImage(
        this.image,
        col * this.frameW,
        row * this.frameH,
        this.frameW,
        this.frameH,
        x,
        y,
        this.frameW * scale,
        this.frameH * scale
      );
      ctx.restore();

      this.counter++;
      if (this.counter % this.frameDelay === 0) {
        this.frameIndex = (this.frameIndex + 1) % (this.cols * this.rows);
      }
    }
  }
}

const playerSprites = {
  idle: new Sprite("assets/player/idle/sprite.png", 4, 4),
  run: new Sprite("assets/player/run/sprite.png", 5, 4),
  jump: new Sprite("assets/player/jump/sprite.png", 6, 4),
  death: new Sprite("assets/player/death/sprite.png", 6, 5),
};

class Player {
  constructor() {
    this.width = 64;
    this.height = 64;
    this.x = 80;
    this.y = 0;
    this.dy = 0;
    this.jumpPower = -20;
    this.grounded = false;
    this.state = "idle";
  }

  update() {
    this.dy += gravity;
    this.y += this.dy;

    const floor = canvas.height - this.height - 40;
    if (this.y >= floor) {
      this.y = floor;
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
      this.grounded = false;
      this.state = "jump";
      if (!isMuted) sounds.jump.play();
    }
  }

  draw() {
    playerSprites[this.state].draw(ctx, this.x, this.y, 2, true);
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
    this.markedForDeletion = false;
  }

  update() {
    this.x -= gameSpeed;
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
const collectibles = [];
const obstacles = [];

const collectibleImages = [
  "assets/images/dress.png",
  "assets/images/handbag.png",
  "assets/images/heels.png",
  "assets/images/earing.png"
];
const obstacleImages = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png"
];

function spawnCollectible() {
  const src = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
  collectibles.push(new GameObject(src, 40, 40));
}

function spawnObstacle() {
  const src = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
  obstacles.push(new GameObject(src, 50, 50));
}

function drawScore() {
  ctx.font = "bold 24px Cinzel Decorative, cursive";
  ctx.fillStyle = "gold";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.font = "bold 36px Cinzel Decorative";
  ctx.textAlign = "center";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 40);
  ctx.font = "24px Cinzel Decorative";
  ctx.fillText(`Your Score: ${score}`, canvas.width / 2, canvas.height / 2);
  ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 40);
}

function resetGame() {
  gameStarted = true;
  gameOver = false;
  score = 0;
  frame = 0;
  gameSpeed = 5;
  collectibles.length = 0;
  obstacles.length = 0;
  player.y = canvas.height - player.height - 40;
  player.state = "run";
  if (!isMuted) {
    sounds.start.play();
    sounds.game.currentTime = 0;
    sounds.game.play();
  }
  startBtn.style.display = "none";
  letsShopBtn.style.display = "none";
}

function gameLoop() {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
  player.update();
  player.draw();

  if (frame % 100 === 0) spawnCollectible();
  if (frame % 160 === 0) spawnObstacle();

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
      player.state = "death";
      gameOver = true;
      if (!isMuted) {
        sounds.game.pause();
        sounds.death.play();
      }
    }
  });

  drawScore();
  frame++;
  if (frame % 600 === 0) gameSpeed += 0.5;

  collectibles.filter(obj => !obj.markedForDeletion);
  obstacles.filter(obj => !obj.markedForDeletion);

  if (!gameOver) {
    requestAnimationFrame(gameLoop);
  } else {
    drawGameOver();
  }
}

// Event Listeners
startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    resetGame();
    requestAnimationFrame(gameLoop);
  }
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    player.jump();
  }
});

window.addEventListener("touchstart", () => {
  if (gameOver) {
    resetGame();
    requestAnimationFrame(gameLoop);
  } else {
    player.jump();
  }
});

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  sounds.game.muted = isMuted;
});

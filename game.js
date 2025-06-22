const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const gameTitle = document.getElementById("game-title");
const overlay = document.getElementById("overlay");
const muteBtn = document.getElementById("muteBtn");

let isMuted = false;
let gameStarted = false;
let gameOver = false;
let score = 0;
let gravity = 1.4;
let frame = 0;
let gameSpeed = 5;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

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

function toggleMute() {
  isMuted = !isMuted;
  Object.values(sounds).forEach(s => s.muted = isMuted);
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
}
muteBtn.addEventListener("click", toggleMute);

// Background image
const backgroundImg = new Image();
backgroundImg.src = "assets/images/bg.jpg";

// Character Animation from sprite.png
class SpriteSheet {
  constructor(folder, frames = 20) {
    this.image = new Image();
    this.image.src = `assets/player/${folder}/sprite.png`;
    this.frameIndex = 0;
    this.frameWidth = 64;
    this.frameHeight = 64;
    this.frameSpeed = 4;
    this.timer = 0;
    this.totalFrames = frames;
  }
  update() {
    this.timer++;
    if (this.timer >= this.frameSpeed) {
      this.frameIndex = (this.frameIndex + 1) % this.totalFrames;
      this.timer = 0;
    }
  }
  draw(x, y, scale = 2) {
    ctx.drawImage(
      this.image,
      this.frameIndex * this.frameWidth,
      0,
      this.frameWidth,
      this.frameHeight,
      x,
      y,
      this.frameWidth * scale,
      this.frameHeight * scale
    );
  }
}

const playerAnimations = {
  idle: new SpriteSheet("idle"),
  run: new SpriteSheet("run"),
  jump: new SpriteSheet("jump"),
  death: new SpriteSheet("death"),
};

class Player {
  constructor() {
    this.width = 64 * 2;
    this.height = 64 * 2;
    this.x = 100;
    this.y = canvas.height - this.height - 40;
    this.dy = 0;
    this.jumpPower = -22;
    this.state = "idle";
    this.grounded = true;
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
      this.grounded = false;
      this.state = "jump";
      if (!isMuted) sounds.jump.play();
    }
  }
  draw() {
    playerAnimations[this.state].update();
    playerAnimations[this.state].draw(this.x, this.y);
  }
}

class GameObject {
  constructor(src, size = 50) {
    this.image = new Image();
    this.image.src = src;
    this.width = size;
    this.height = size;
    this.x = canvas.width + Math.random() * 300;
    this.y = canvas.height - this.height - 40;
    this.speed = gameSpeed;
    this.marked = false;
  }
  update() {
    this.x -= this.speed;
    if (this.x + this.width < 0) this.marked = true;
  }
  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }
  collides(player) {
    return !(
      player.x > this.x + this.width ||
      player.x + player.width < this.x ||
      player.y > this.y + this.height ||
      player.y + player.height < this.y
    );
  }
}

const player = new Player();

const collectibleList = [
  "assets/images/dress.png",
  "assets/images/heels.png",
  "assets/images/handbag.png",
  "assets/images/earings.png",
];

const obstacleList = [
  "assets/images/obstacle_cart.png",
  "assets/images/obstacle_bag.png",
  "assets/images/obstacle_hanger.png",
];

let collectibles = [];
let obstacles = [];

function spawnCollectible() {
  const img = collectibleList[Math.floor(Math.random() * collectibleList.length)];
  collectibles.push(new GameObject(img, 48));
}

function spawnObstacle() {
  const img = obstacleList[Math.floor(Math.random() * obstacleList.length)];
  obstacles.push(new GameObject(img, 52));
}

function drawScore() {
  ctx.fillStyle = "gold";
  ctx.font = "24px Cinzel Decorative, cursive";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "gold";
  ctx.textAlign = "center";
  ctx.font = "38px Cinzel Decorative";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = "22px Cinzel Decorative";
  ctx.fillText("Tap or press space to try again", canvas.width / 2, canvas.height / 2 + 30);
}

function resetGame() {
  score = 0;
  frame = 0;
  gameSpeed = 5;
  gameOver = false;
  player.y = canvas.height - player.height - 40;
  player.dy = 0;
  player.state = "run";
  collectibles = [];
  obstacles = [];
  if (!isMuted) {
    sounds.start.play();
    sounds.game.currentTime = 0;
    sounds.game.play();
  }
  overlay.style.display = "none";
  gameLoop();
}

function gameLoop() {
  if (!gameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    player.update();
    player.draw();

    if (frame % 130 === 0) spawnCollectible();
    if (frame % 180 === 0) spawnObstacle();

    collectibles.forEach((item, index) => {
      item.update();
      item.draw();
      if (item.collides(player)) {
        score += 10;
        if (!isMuted) sounds.collect.play();
        collectibles.splice(index, 1);
      }
    });

    obstacles.forEach((obs, index) => {
      obs.update();
      obs.draw();
      if (obs.collides(player)) {
        gameOver = true;
        player.state = "death";
        if (!isMuted) {
          sounds.death.play();
          sounds.game.pause();
        }
      }
    });

    collectibles = collectibles.filter(i => !i.marked);
    obstacles = obstacles.filter(i => !i.marked);

    drawScore();
    frame++;
    requestAnimationFrame(gameLoop);
  } else {
    player.draw();
    drawScore();
    drawGameOver();
  }
}

// Events
window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (gameOver) {
      resetGame();
    } else {
      player.jump();
    }
  }
});
window.addEventListener("touchstart", () => {
  if (gameOver) {
    resetGame();
  } else {
    player.jump();
  }
});

startBtn.addEventListener("click", () => {
  gameStarted = true;
  resetGame();
});
letsShopBtn.addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});

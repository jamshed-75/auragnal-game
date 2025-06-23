const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let muted = false;
let gameOver = false;
let bgX = 0;
let restartTimeout;

const background = new Image();
background.src = "assets/images/bg.jpg";

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  jump: new Audio("assets/sound/jump.wav"),
  game: new Audio("assets/sound/game.wav"),
  death: new Audio("assets/sound/death.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
};

Object.values(sounds).forEach((s) => s.volume = 0.5);

function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

class Player {
  constructor() {
    this.x = 80;
    this.y = 0;
    this.width = 80;
    this.height = 120;
    this.vy = 0;
    this.gravity = 0.8;
    this.jumpForce = -14;
    this.grounded = false;
    this.frameIndex = 0;
    this.frameSpeed = 0.2;
    this.frames = [
      loadImage("assets/player/run/run1.png"),
      loadImage("assets/player/run/run2.png"),
      loadImage("assets/player/run/run3.png"),
      loadImage("assets/player/run/run4.png"),
    ];
  }

  jump() {
    if (this.grounded) {
      this.vy = this.jumpForce;
      this.grounded = false;
      playSound("jump");
    }
  }

  update() {
    this.vy += this.gravity;
    this.y += this.vy;

    if (this.y + this.height >= canvas.height - 40) {
      this.y = canvas.height - this.height - 40;
      this.vy = 0;
      this.grounded = true;
    }

    this.frameIndex += this.frameSpeed;
    if (this.frameIndex >= this.frames.length) this.frameIndex = 0;
  }

  draw() {
    const frame = this.frames[Math.floor(this.frameIndex)];
    ctx.drawImage(frame, this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

class GameObject {
  constructor(imagePath, speed, isObstacle = true) {
    this.image = loadImage(imagePath);
    this.width = 50;
    this.height = 50;
    this.x = canvas.width;
    this.y = canvas.height - this.height - 40;
    this.speed = speed;
    this.isObstacle = isObstacle;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

let player = new Player();
let objects = [];

function spawnObject() {
  if (!gameRunning) return;
  const isObstacle = Math.random() > 0.5;
  const files = isObstacle
    ? ["obstacle_bag.png", "obstacle_cart.png"]
    : ["dress.png", "handbag.png", "earing.png"];
  const img = files[Math.floor(Math.random() * files.length)];
  const path = `assets/images/${img}`;
  objects.push(new GameObject(path, 5, isObstacle));
}

function playSound(name) {
  if (!muted && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

function toggleMute() {
  muted = !muted;
  document.getElementById("muteBtn").textContent = muted ? "🔇" : "🔊";
  Object.values(sounds).forEach((s) => (s.muted = muted));
}

document.getElementById("muteBtn").addEventListener("click", toggleMute);

function startGame() {
  gameRunning = true;
  gameOver = false;
  player = new Player();
  objects = [];
  bgX = 0;
  playSound("start");
  clearTimeout(restartTimeout);
  requestAnimationFrame(gameLoop);
  setInterval(spawnObject, 2000);
}

document.getElementById("startBtn").addEventListener("click", startGame);

document.getElementById("lets-shop").addEventListener("click", () => {
  window.location.href = "https://auragnal.com";
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") player.jump();
});

canvas.addEventListener("click", () => {
  if (gameOver) startGame();
  else player.jump();
});

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background scroll
  bgX -= 2;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(background, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(background, bgX + canvas.width, 0, canvas.width, canvas.height);

  player.update();
  player.draw();

  objects.forEach((obj) => {
    obj.update();
    obj.draw();
  });

  const playerBounds = player.getBounds();

  for (const obj of objects) {
    const o = obj.getBounds();
    if (
      playerBounds.x < o.x + o.width &&
      playerBounds.x + playerBounds.width > o.x &&
      playerBounds.y < o.y + o.height &&
      playerBounds.y + playerBounds.height > o.y
    ) {
      if (obj.isObstacle) {
        playSound("death");
        gameRunning = false;
        gameOver = true;
        ctx.fillStyle = "#fff";
        ctx.font = "30px Arial";
        ctx.fillText("Tap to Restart", canvas.width / 2 - 100, canvas.height / 2);
        return;
      } else {
        playSound("collect");
        objects.splice(objects.indexOf(obj), 1);
      }
    }
  }

  objects = objects.filter((o) => o.x + o.width > 0);

  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const container = document.getElementById("game-container");
  if (!container) return;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

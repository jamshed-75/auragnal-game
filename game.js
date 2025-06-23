const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameRunning = false;
let muted = false;
let bgX = 0;

const background = new Image();
background.src = "assets/images/bg.jpg";

// Sound setup
const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  jump: new Audio("assets/sound/jump.wav"),
  game: new Audio("assets/sound/game.wav"),
  death: new Audio("assets/sound/death.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  message: new Audio("assets/sound/message.wav"),
};

Object.values(sounds).forEach((sound) => (sound.volume = 0.5));

// Utility
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// Animation Class
class Animation {
  constructor(folder, frameCount, prefix = folder) {
    this.frames = [];
    for (let i = 1; i <= frameCount; i++) {
      this.frames.push(loadImage(`assets/player/${folder}/${prefix}${i}.png`));
    }
    this.index = 0;
    this.speed = 0.2;
  }

  update() {
    this.index += this.speed;
    if (this.index >= this.frames.length) this.index = 0;
  }

  draw(x, y, width, height) {
    const frame = this.frames[Math.floor(this.index)];
    ctx.drawImage(frame, x, y, width, height);
  }
}

// Player
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
    this.state = "idle";

    this.animations = {
      idle: new Animation("idle", 3),
      run: new Animation("run", 4),
      jump: new Animation("jump", 4),
      death: new Animation("death", 2),
    };
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

    if (!this.grounded) {
      this.state = "jump";
    } else {
      this.state = "run";
    }

    this.animations[this.state].update();
  }

  draw() {
    this.animations[this.state].draw(this.x, this.y, this.width, this.height);
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}

// Obstacles & Collectibles
class GameObject {
  constructor(imagePath, speed, isObstacle = true) {
    this.image = loadImage(imagePath);
    this.width = 60;
    this.height = 60;
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
  const isObstacle = Math.random() > 0.5;
  const img = isObstacle
    ? ["obstacle_bag.png", "obstacle_cart.png", "obstacle_hanger.png"]
    : ["dress.png", "handbag.png", "earing.png", "heels.png"];
  const file = img[Math.floor(Math.random() * img.length)];
  const path = `assets/images/${file}`;
  objects.push(new GameObject(path, 6, isObstacle));
}

// Sound Control
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
  if (!gameRunning) {
    gameRunning = true;
    player = new Player();
    objects = [];
    playSound("start");
    setInterval(spawnObject, 2000);
    requestAnimationFrame(gameLoop);
  }
}

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("lets-shop").addEventListener("click", () => {
  alert("Redirecting to AURAGNAL shopping soon!");
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});

canvas.addEventListener("click", () => player.jump());

// Game Loop
function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // background scroll
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

  // Collision Detection
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
        alert("Game Over");
        return;
      } else {
        playSound("collect");
        objects.splice(objects.indexOf(obj), 1);
      }
    }
  }

  objects = objects.filter((obj) => obj.x + obj.width > 0);

  requestAnimationFrame(gameLoop);
}

// Resize canvas
function resizeCanvas() {
  const container = document.getElementById("game-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);

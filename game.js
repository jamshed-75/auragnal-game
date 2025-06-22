const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const gameTitle = document.getElementById("game-title");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");

let muted = false;

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  collect: new Audio("assets/sound/collect.ogg"),
  jump: new Audio("assets/sound/jump.wav"),
  death: new Audio("assets/sound/death.wav"),
  message: new Audio("assets/sound/message.wav"),
  game: new Audio("assets/sound/game.wav"),
};

sounds.game.loop = true;

muteBtn.addEventListener("click", () => {
  muted = !muted;
  for (let key in sounds) {
    sounds[key].muted = muted;
  }
  muteBtn.textContent = muted ? "🔇" : "🔊";
});

function resizeCanvas() {
  const maxWidth = 1000;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientWidth / (16 / 9);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

class Sprite {
  constructor(imageSrc, columns, rows, frameSpeed = 5) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.columns = columns;
    this.rows = rows;
    this.frameSpeed = frameSpeed;
    this.frame = 0;
    this.timer = 0;
  }

  update() {
    this.timer++;
    if (this.timer >= this.frameSpeed) {
      this.timer = 0;
      this.frame = (this.frame + 1) % (this.columns * this.rows);
    }
  }

  draw(x, y, scale = 1) {
    const frameW = this.image.width / this.columns;
    const frameH = this.image.height / this.rows;
    const cx = (this.frame % this.columns) * frameW;
    const cy = Math.floor(this.frame / this.columns) * frameH;

    ctx.drawImage(
      this.image,
      cx, cy, frameW, frameH,
      x, y, frameW * scale, frameH * scale
    );
  }
}

const animations = {
  idle: new Sprite("assets/player/idle/sprite.png", 4, 4),
  run: new Sprite("assets/player/run/sprite.png", 5, 4),
  jump: new Sprite("assets/player/jump/sprite.png", 6, 4),
  death: new Sprite("assets/player/death/sprite.png", 6, 5),
};

class Player {
  constructor() {
    this.scale = 1.5;
    this.anim = animations.idle;
    this.x = canvas.width * 0.1;
    this.y = canvas.height * 0.7;
    this.dy = 0;
    this.gravity = 1.5;
    this.jumpPower = -18;
    this.grounded = true;
    this.width = 64;
    this.height = 64;
    this.state = "idle";
  }

  update() {
    this.dy += this.gravity;
    this.y += this.dy;

    const ground = canvas.height - this.height * this.scale - 20;

    if (this.y >= ground) {
      this.y = ground;
      this.dy = 0;
      this.grounded = true;
      if (this.state === "jump") this.setState("run");
    } else {
      this.grounded = false;
    }

    this.anim.update();
  }

  draw() {
    this.anim.draw(this.x, this.y, this.scale);
  }

  jump() {
    if (this.grounded) {
      this.dy = this.jumpPower;
      this.setState("jump");
      sounds.jump.play();
    }
  }

  setState(state) {
    this.state = state;
    this.anim = animations[state];
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      w: this.width * this.scale,
      h: this.height * this.scale,
    };
  }
}

class GameObject {
  constructor(imageSrc, scale = 1) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.scale = scale;
    this.width = 60 * scale;
    this.height = 60 * scale;
    this.x = canvas.width + Math.random() * 200;
    this.y = canvas.height - this.height - 20;
    this.speed = 6;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  isOffscreen() {
    return this.x + this.width < 0;
  }

  collides(player) {
    const p = player.getBounds();
    return (
      p.x < this.x + this.width &&
      p.x + p.w > this.x &&
      p.y < this.y + this.height &&
      p.y + p.h > this.y
    );
  }
}

const player = new Player();
const bg = new Image();
bg.src = "assets/images/bg.jpg";

let collectibles = [];
let obstacles = [];
let score = 0;
let frame = 0;
let gameRunning = false;

function spawnObjects() {
  if (frame % 120 === 0) {
    const c = new GameObject(randomCollectible(), 1.2);
    collectibles.push(c);
  }

  if (frame % 200 === 0) {
    const o = new GameObject(randomObstacle(), 1.4);
    obstacles.push(o);
  }
}

function randomCollectible() {
  const c = ["dress", "handbag", "heels", "earings"];
  const name = c[Math.floor(Math.random() * c.length)];
  return `assets/images/${name}.png`;
}

function randomObstacle() {
  const o = ["obstacle_cart", "obstacle_bag", "obstacle_hanger"];
  const name = o[Math.floor(Math.random() * o.length)];
  return `assets/images/${name}.png`;
}

function drawBackground() {
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
}

function drawScore() {
  ctx.fillStyle = "gold";
  ctx.font = "20px Cinzel Decorative";
  ctx.fillText(`Score: ${score}`, 20, 40);
}

function resetGame() {
  score = 0;
  frame = 0;
  player.x = canvas.width * 0.1;
  player.setState("run");
  collectibles = [];
  obstacles = [];
  gameRunning = true;
  startBtn.style.display = "none";
  gameTitle.style.display = "none";
  letsShopBtn.style.display = "none";
  sounds.game.currentTime = 0;
  sounds.game.play();
  loop();
}

function loop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  player.update();
  player.draw();

  spawnObjects();

  collectibles.forEach((c, i) => {
    c.update();
    c.draw();
    if (c.collides(player)) {
      sounds.collect.play();
      score += 10;
      collectibles.splice(i, 1);
    }
  });

  obstacles.forEach((o, i) => {
    o.update();
    o.draw();
    if (o.collides(player)) {
      sounds.death.play();
      gameOver();
    }
  });

  collectibles = collectibles.filter(c => !c.isOffscreen());
  obstacles = obstacles.filter(o => !o.isOffscreen());

  drawScore();
  frame++;
  requestAnimationFrame(loop);
}

function gameOver() {
  gameRunning = false;
  startBtn.textContent = "Try Again";
  startBtn.style.display = "block";
  gameTitle.style.display = "block";
  letsShopBtn.style.display = "block";
  player.setState("death");
  sounds.game.pause();
}

startBtn.addEventListener("click", () => {
  sounds.start.play();
  resetGame();
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});
window.addEventListener("touchstart", () => player.jump());

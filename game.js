const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";

let bgX = 0;
let bgSpeed = 2;

const GRAVITY = 0.8;
const JUMP_STRENGTH = -15;
let isGameRunning = false;
let isMuted = false;

const player = {
  x: 50,
  y: 300,
  width: 60,
  height: 100,
  vy: 0,
  onGround: true,
  frameIndex: 0,
  frameTimer: 0,
  frameDelay: 100,
  state: "idle", // "run", "jump", "death"
  frames: {
    idle: [],
    run: [],
    jump: [],
    death: [],
  },
};

const obstacles = [];
const collectibles = [];

const sounds = {
  start: new Audio("assets/sound/start.mp3"),
  jump: new Audio("assets/sound/jump.wav"),
  collect: new Audio("assets/sound/collect.ogg"),
  death: new Audio("assets/sound/death.wav"),
  game: new Audio("assets/sound/game.wav"),
};

function loadPlayerFrames() {
  const states = ["idle", "run", "jump", "death"];
  const counts = { idle: 3, run: 4, jump: 4, death: 2 };

  states.forEach(state => {
    for (let i = 1; i <= counts[state]; i++) {
      const img = new Image();
      img.src = `assets/player/${state}/${state}${i}.png`;
      player.frames[state].push(img);
    }
  });
}

function playSound(name) {
  if (!isMuted && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

function drawBackground() {
  bgX -= bgSpeed;
  if (bgX <= -canvas.width) bgX = 0;
  ctx.drawImage(bgImage, bgX, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, bgX + canvas.width, 0, canvas.width, canvas.height);
}

function drawPlayer() {
  const frames = player.frames[player.state];
  const frame = frames[player.frameIndex];
  if (frame) {
    ctx.drawImage(frame, player.x, player.y, player.width, player.height);
  }
}

function updatePlayer(delta) {
  player.vy += GRAVITY;
  player.y += player.vy;

  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.vy = 0;
    player.onGround = true;
    if (player.state !== "idle") player.state = "run";
  } else {
    player.onGround = false;
  }

  player.frameTimer += delta;
  if (player.frameTimer > player.frameDelay) {
    player.frameIndex = (player.frameIndex + 1) % player.frames[player.state].length;
    player.frameTimer = 0;
  }
}

function spawnObstacle() {
  const img = new Image();
  const types = ["obstacle_bag", "obstacle_cart", "obstacle_hanger"];
  const type = types[Math.floor(Math.random() * types.length)];
  img.src = `assets/images/${type}.png`;
  const size = 60;

  obstacles.push({ x: canvas.width, y: canvas.height - size, width: size, height: size, img });
}

function spawnCollectible() {
  const img = new Image();
  const types = ["dress", "earring", "handbag", "heels"];
  const type = types[Math.floor(Math.random() * types.length)];
  img.src = `assets/images/${type}.png`;
  const size = 50;

  collectibles.push({ x: canvas.width, y: canvas.height - 150, width: size, height: size, img });
}

function updateObjects(list, speed) {
  list.forEach(obj => obj.x -= speed);
}

function drawObjects(list) {
  list.forEach(obj => ctx.drawImage(obj.img, obj.x, obj.y, obj.width, obj.height));
}

function checkCollisions() {
  obstacles.forEach(obs => {
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y
    ) {
      endGame();
    }
  });

  collectibles.forEach((col, index) => {
    if (
      player.x < col.x + col.width &&
      player.x + player.width > col.x &&
      player.y < col.y + col.height &&
      player.y + player.height > col.y
    ) {
      playSound("collect");
      collectibles.splice(index, 1);
    }
  });
}

function endGame() {
  isGameRunning = false;
  player.state = "death";
  playSound("death");
}

function resetGame() {
  player.x = 50;
  player.y = 300;
  player.vy = 0;
  player.state = "run";
  player.frameIndex = 0;
  obstacles.length = 0;
  collectibles.length = 0;
  playSound("start");
  isGameRunning = true;
  sounds.game.loop = true;
  playSound("game");
}

let lastTime = 0;
let obstacleTimer = 0;
let collectibleTimer = 0;

function gameLoop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();

  if (isGameRunning) {
    updatePlayer(delta);
    updateObjects(obstacles, bgSpeed);
    updateObjects(collectibles, bgSpeed);
    drawObjects(collectibles);
    drawObjects(obstacles);
    drawPlayer();
    checkCollisions();

    obstacleTimer += delta;
    collectibleTimer += delta;

    if (obstacleTimer > 1500) {
      spawnObstacle();
      obstacleTimer = 0;
    }

    if (collectibleTimer > 3000) {
      spawnCollectible();
      collectibleTimer = 0;
    }
  } else {
    drawPlayer();
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "gold";
    ctx.font = "30px Cinzel Decorative";
    ctx.fillText("Tap to Try Again", canvas.width / 2 - 100, canvas.height / 2);
  }

  requestAnimationFrame(gameLoop);
}

// 🎮 Event Listeners
document.getElementById("startBtn").addEventListener("click", () => {
  if (!isGameRunning) {
    resetGame();
  }
});

document.getElementById("lets-shop").addEventListener("click", () => {
  alert("Redirect to AURAGNAL shop (coming soon)");
});

document.getElementById("muteBtn").addEventListener("click", () => {
  isMuted = !isMuted;
  document.getElementById("muteBtn").textContent = isMuted ? "🔇" : "🔊";
});

window.addEventListener("keydown", e => {
  if (e.code === "Space" && player.onGround && isGameRunning) {
    player.vy = JUMP_STRENGTH;
    player.state = "jump";
    player.frameIndex = 0;
    playSound("jump");
  } else if (!isGameRunning) {
    resetGame();
  }
});

function resizeCanvas() {
  const container = document.getElementById("game-container");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", () => {
  resizeCanvas();
  loadPlayerFrames();
  drawBackground();
  drawPlayer();
});

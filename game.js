const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameStarted = false;
let gameOver = false;
let score = 0;

const gravity = 1;
let collectibles = [];
let obstacles = [];

// Load sounds
const sounds = {
  start: new Audio("assets/sounds/start.mp3"),
  collect: new Audio("assets/sounds/collect.ogg"),
  death: new Audio("assets/sounds/death.wav"),
  jump: new Audio("assets/sounds/jump.wav"),
  message: new Audio("assets/sounds/message.wav"),
  game: new Audio("assets/sounds/game.wav")
};

// Player setup
const player = {
  x: 100,
  y: 500,
  width: 80,
  height: 120,
  vy: 0,
  grounded: false,
  currentFrame: 0,
  animationTimer: 0,
  state: "idle", // idle, run, jump, death
  frameCount: 32
};

const imageCache = {};
function loadImage(src) {
  if (!imageCache[src]) {
    const img = new Image();
    img.src = src;
    imageCache[src] = img;
  }
  return imageCache[src];
}

// Load background
const bgImage = loadImage("assets/images/bg.jpg");

// Start Game
document.getElementById("start-game").addEventListener("click", () => {
  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("scoreboard").style.display = "block";
  sounds.start.play();
  sounds.game.loop = true;
  sounds.game.play();
  gameStarted = true;
  initObjects();
  animate();
});

// Restart
function restartGame() {
  location.reload();
}

// Initialize objects
function initObjects() {
  collectibles = [];
  obstacles = [];

  const types = ["dress", "handbag", "earings", "heels"];
  for (let i = 0; i < 6; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    collectibles.push({
      type,
      x: 1600 + i * 500,
      y: 520,
      width: 80,
      height: 80,
    });
  }

  const obsTypes = ["obstacle_bag", "obstacle_cart", "obstacle_hanger"];
  for (let i = 0; i < 4; i++) {
    const type = obsTypes[Math.floor(Math.random() * obsTypes.length)];
    obstacles.push({
      type,
      x: 1300 + i * 700,
      y: 540,
      width: 90,
      height: 90,
    });
  }
}

// Jump
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && player.grounded) {
    player.vy = -18;
    player.grounded = false;
    player.state = "jump";
    sounds.jump.play();
  }
});

// Game Loop
function animate() {
  if (!gameStarted || gameOver) return;

  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  // Gravity
  player.vy += gravity;
  player.y += player.vy;

  if (player.y >= 500) {
    player.y = 500;
    player.vy = 0;
    player.grounded = true;
    if (player.state !== "idle") player.state = "run";
  }

  // Draw player
  updatePlayerAnimation();
  const frame = Math.floor(player.currentFrame) + 1;
  const playerImg = loadImage(`assets/player/${player.state}/${frame}.png`);
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Draw collectibles
  collectibles.forEach((c, i) => {
    c.x -= 5;
    const img = loadImage(`assets/images/${c.type}/1.png`);
    ctx.drawImage(img, c.x, c.y, c.width, c.height);

    // Collision
    if (checkCollision(player, c)) {
      collectibles.splice(i, 1);
      score++;
      document.getElementById("score").innerText = score;
      sounds.collect.play();
    }
  });

  // Draw obstacles
  obstacles.forEach((o, i) => {
    o.x -= 6;
    const img = loadImage(`assets/images/${o.type}/1.png`);
    ctx.drawImage(img, o.x, o.y, o.width, o.height);

    if (checkCollision(player, o)) {
      player.state = "death";
      sounds.death.play();
      gameOver = true;
      sounds.game.pause();
      document.getElementById("game-over-screen").style.display = "flex";
      document.getElementById("final-score").innerText = score;
    }
  });
}

// Player animation
function updatePlayerAnimation() {
  player.animationTimer++;
  if (player.animationTimer % 5 === 0) {
    player.currentFrame = (player.currentFrame + 1) % player.frameCount;
  }
}

// Collision detection
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

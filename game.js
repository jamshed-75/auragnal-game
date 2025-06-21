"use strict";

// Canvas and context
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// UI Elements
const startBtn = document.getElementById("start-btn");
const shopBtn = document.getElementById("shop-btn");
const scoreDisplay = document.getElementById("score-display");
const gameOverDiv = document.getElementById("game-over");
const finalScoreSpan = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");
const welcomeText = document.getElementById("welcome-text");

const GAME_WIDTH = canvas.width;
const GAME_HEIGHT = canvas.height;

// Asset paths
const ASSET_PATHS = {
  player: {
    idle: './assets/player/idle/',
    run: './assets/player/run/',
    jump: './assets/player/jump/',
    death: './assets/player/death/'
  },
  collectibles: {
    dress: './assets/images/dress/',
    heels: './assets/images/heels/',
    handbag: './assets/images/handbag/',
    earings: './assets/images/earings/'
  },
  obstacles: {
    cart: './assets/images/obstacle_cart/',
    bag: './assets/images/obstacle_bag/',
    hanger: './assets/images/obstacle_hanger/'
  },
  sounds: {
    start: './assets/sounds/start.mp3',
    collect: './assets/sounds/collect.ogg',
    jump: './assets/sounds/jump.wav',
    death: './assets/sounds/death.wav',
    message: './assets/sounds/message.wav',
    game: './assets/sounds/game.wav'
  }
};

// Game state variables
let gameStarted = false;
let score = 0;
let gameOver = false;

// Player config
const PLAYER_WIDTH = 80;
const PLAYER_HEIGHT = 140;
const GRAVITY = 0.8;
const JUMP_STRENGTH = -18;
const GROUND_LEVEL = GAME_HEIGHT - 150;

// Key controls
let keys = {};

// Helper: Load image
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
  });
}

// Helper: Load sound
function loadSound(src) {
  const audio = new Audio(src);
  audio.load();
  return audio;
}

// Player class
class Player {
  constructor() {
    this.x = 150;
    this.y = GROUND_LEVEL - PLAYER_HEIGHT;
    this.vy = 0;
    this.width = PLAYER_WIDTH;
    this.height = PLAYER_HEIGHT;
    this.isJumping = false;
    this.isDead = false;
    this.frameIndex = 0;
    this.frameSpeed = 6; // Frames per animation frame
    this.frameCount = 0;
    this.currentAnimation = "idle"; // idle, run, jump, death
    this.animations = {
      idle: [],
      run: [],
      jump: [],
      death: []
    };
  }

  async loadAnimations() {
    for (const state of Object.keys(this.animations)) {
      this.animations[state] = [];
      for (let i = 1; i <= 32; i++) {
        const img = await loadImage(`${ASSET_PATHS.player[state]}${i}.png`);
        this.animations[state].push(img);
      }
    }
  }

  update() {
    if (this.isDead) {
      this.currentAnimation = "death";
      this.frameSpeed = 8;
    } else if (this.isJumping) {
      this.currentAnimation = "jump";
      this.frameSpeed = 8;
    } else {
      this.currentAnimation = "run";
      this.frameSpeed = 6;
    }

    // Apply gravity
    this.vy += GRAVITY;
    this.y += this.vy;

    if (this.y + this.height >= GROUND_LEVEL) {
      this.y = GROUND_LEVEL - this.height;
      this.vy = 0;
      this.isJumping = false;
    }

    // Animate frame
    this.frameCount++;
    if (this.frameCount >= this.frameSpeed) {
      this.frameCount = 0;
      this.frameIndex = (this.frameIndex + 1) % this.animations[this.currentAnimation].length;
    }
  }

  jump() {
    if (!this.isJumping && !this.isDead) {
      this.vy = JUMP_STRENGTH;
      this.isJumping = true;
      jumpSound.play();
    }
  }

  draw(ctx) {
    const img = this.animations[this.currentAnimation][this.frameIndex];
    if (img) {
      ctx.drawImage(img, this.x, this.y, this.width, this.height);
    } else {
      // fallback: draw yellow box
      ctx.fillStyle = 'yellow';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}

// Collectible class
class Collectible {
  constructor(type, x, y, img) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = 70;
    this.height = 70;
    this.image = img;
    this.collected = false;
  }

  update() {
    // Move leftwards with the game speed
    this.x -= gameSpeed;
  }

  draw(ctx) {
    if (!this.collected) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }

  getRect() {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }
}

// Obstacle class
class Obstacle {
  constructor(type, x, y, img) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = 90;
    this.height = 120;
    this.image = img;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw(ctx) {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  getRect() {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }
}

// Collision detection helper
function rectsOverlap(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect1.x > rect2.x + rect2.width ||
    rect1.y + rect1.height < rect2.y ||
    rect1.y > rect2.y + rect2.height
  );
}

// Load all collectible images once
async function loadCollectiblesImages() {
  const types = Object.keys(ASSET_PATHS.collectibles);
  let loaded = {};
  for (const type of types) {
    const img = await loadImage(`${ASSET_PATHS.collectibles[type]}1.png`);
    loaded[type] = img;
  }
  return loaded;
}

// Load all obstacle images once
async function loadObstaclesImages() {
  const types = Object.keys(ASSET_PATHS.obstacles);
  let loaded = {};
  for (const type of types) {
    const img = await loadImage(`${ASSET_PATHS.obstacles[type]}1.png`);
    loaded[type] = img;
  }
  return loaded;
}

// Sounds
const startSound = loadSound(ASSET_PATHS.sounds.start);
const collectSound = loadSound(ASSET_PATHS.sounds.collect);
const jumpSound = loadSound(ASSET_PATHS.sounds.jump);
const deathSound = loadSound(ASSET_PATHS.sounds.death);
const messageSound = loadSound(ASSET_PATHS.sounds.message);
const gameMusic = loadSound(ASSET_PATHS.sounds.game);
gameMusic.loop = true;
gameMusic.volume = 0.25;

// Game variables
let player;
let collectibles = [];
let obstacles = [];
let gameSpeed = 8;
let collectibleSpawnTimer = 0;
let obstacleSpawnTimer = 0;
let collectibleSpawnInterval = 140;
let obstacleSpawnInterval = 180;

// Initialize game
async function init() {
  player = new Player();
  await player.loadAnimations();

  collectibles = [];
  obstacles = [];
  score = 0;
  gameSpeed = 8;
  collectibleSpawnTimer = 0;
  obstacleSpawnTimer = 0;
  gameOver = false;

  scoreDisplay.textContent = "Score: 0";

  // Hide game over UI and show buttons
  gameOverDiv.classList.add("hidden");
  scoreDisplay.style.display = "block";
  canvas.style.display = "block";
  startBtn.style.display = "none";
  welcomeText.style.display = "none";

  gameMusic.play();

  requestAnimationFrame(gameLoop);
}

// Spawn collectibles randomly
function spawnCollectible(collectibleImgs) {
  const types = Object.keys(collectibleImgs);
  const type = types[Math.floor(Math.random() * types.length)];
  const img = collectibleImgs[type];
  const x = GAME_WIDTH + 100;
  const y = GROUND_LEVEL - 70 - Math.random() * 100; // variable height a bit
  collectibles.push(new Collectible(type, x, y, img));
}

// Spawn obstacles randomly
function spawnObstacle(obstacleImgs) {
  const types = Object.keys(obstacleImgs);
  const type = types[Math.floor(Math.random() * types.length)];
  const img = obstacleImgs[type];
  const x = GAME_WIDTH + 100;
  const y = GROUND_LEVEL - 120;
  obstacles.push(new Obstacle(type, x, y, img));
}

// Main game loop
function gameLoop() {
  if (gameOver) return;

  // Clear canvas
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Draw background is CSS so canvas is transparent

  // Update player
  player.update();
  player.draw(ctx);

  // Spawn collectibles
  collectibleSpawnTimer++;
  if (collectibleSpawnTimer >= collectibleSpawnInterval) {
    spawnCollectible(loadedCollectibleImages);
    collectibleSpawnTimer = 0;
  }

  // Spawn obstacles
  obstacleSpawnTimer++;
  if (obstacleSpawnTimer >= obstacleSpawnInterval) {
    spawnObstacle(loadedObstacleImages);
    obstacleSpawnTimer = 0;
  }

  // Update collectibles
  for (let i = collectibles.length - 1; i >= 0; i--) {
    const c = collectibles[i];
    c.update();
    c.draw(ctx);

    // Remove offscreen collectibles
    if (c.x + c.width < 0) {
      collectibles.splice(i, 1);
      continue;
    }

    // Collision with player
    if (!c.collected && rectsOverlap(player, c.getRect())) {
      c.collected = true;
      collectSound.play();
      score += 10;
      scoreDisplay.textContent = "Score: " + score;
      collectibles.splice(i, 1);
    }
  }

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.update();
    o.draw(ctx);

    // Remove offscreen obstacles
    if (o.x + o.width < 0) {
      obstacles.splice(i, 1);
      continue;
    }

    // Collision with player = Game Over
    if (rectsOverlap(player, o.getRect())) {
      deathSound.play();
      gameOver = true;
      endGame();
    }
  }

  // Increase difficulty gradually
  if (score > 0 && score % 50 === 0) {
    gameSpeed = 8 + Math.floor(score / 50);
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameMusic.pause();
  finalScoreSpan.textContent = score;
  gameOverDiv.classList.remove("hidden");
  scoreDisplay.style.display = "none";
  canvas.style.display = "none";
  startBtn.style.display = "none";
  shopBtn.style.display = "block";
  welcomeText.style.display = "none";
}

// Handle keys for jump
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    if (!gameOver && gameStarted) {
      player.jump();
    }
  }
});

// Touch support for jump
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!gameOver && gameStarted) {
    player.jump();
  }
}, { passive: false });

// Button events
startBtn.addEventListener("click", async () => {
  if (!gameStarted) {
    startSound.play();
    gameStarted = true;
    shopBtn.style.display = "none";
    await init();
  }
});

restartBtn.addEventListener("click", async () => {
  gameStarted = true;
  gameOver = false;
  gameOverDiv.classList.add("hidden");
  shopBtn.style.display = "none";
  await init();
});

shopBtn.addEventListener("click", () => {
  window.location.href = "https://jyxc86-ji.myshopify.com";
});

// Preload all assets
let loadedCollectibleImages = {};
let loadedObstacleImages = {};

async function preloadAssets() {
  loadedCollectibleImages = await loadCollectiblesImages();
  loadedObstacleImages = await loadObstaclesImages();
}

preloadAssets();

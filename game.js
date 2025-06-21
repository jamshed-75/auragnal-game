// AURAGNAL Game - Fully Functional

// Get DOM elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startBtn = document.getElementById('start-btn');
const shopBtn = document.getElementById('shop-btn');
const gameUI = document.getElementById('game-ui');
const scoreDisplay = document.getElementById('score');

// Constants
const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 1080;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const GRAVITY = 1.0;
const PLAYER_SPEED = 8;
const JUMP_FORCE = 24;

let gameRunning = false;
let score = 0;

// Load sounds
const sounds = {
  start: new Audio('./assets/sounds/start.mp3'),
  collect: new Audio('./assets/sounds/collect.ogg'),
  jump: new Audio('./assets/sounds/jump.wav'),
  death: new Audio('./assets/sounds/death.wav'),
  message: new Audio('./assets/sounds/message.wav'),
  game: new Audio('./assets/sounds/game.wav'),
};

// Loop sounds setup
sounds.game.loop = true;
sounds.game.volume = 0.15;

// Player class
class Player {
  constructor() {
    this.width = 80;
    this.height = 140;
    this.x = 100;
    this.y = CANVAS_HEIGHT - this.height - 60; // Ground level approx
    this.velY = 0;
    this.jumping = false;
    this.grounded = false;
    this.frame = 0;
    this.frameSpeed = 5;
    this.frameCount = 32;
    this.animTimer = 0;
    this.state = 'idle'; // 'idle', 'run', 'jump', 'death'
    this.sprites = {
      idle: [],
      run: [],
      jump: [],
      death: [],
    };
    this.loadSprites();
  }

  loadSprites() {
    const states = ['idle', 'run', 'jump', 'death'];
    states.forEach(state => {
      for (let i = 1; i <= 32; i++) {
        const img = new Image();
        img.src = `./assets/player/${state}/${i}.png`;
        this.sprites[state].push(img);
      }
    });
  }

  update() {
    // Gravity
    if (!this.grounded) {
      this.velY += GRAVITY;
      this.y += this.velY;
    }

    // Ground collision
    if (this.y + this.height >= CANVAS_HEIGHT - 60) {
      this.y = CANVAS_HEIGHT - 60 - this.height;
      this.grounded = true;
      this.velY = 0;
      this.jumping = false;
    } else {
      this.grounded = false;
    }

    // Animation frame update
    this.animTimer++;
    if (this.animTimer >= this.frameSpeed) {
      this.frame = (this.frame + 1) % this.frameCount;
      this.animTimer = 0;
    }
  }

  jump() {
    if (this.grounded) {
      this.velY = -JUMP_FORCE;
      this.grounded = false;
      this.jumping = true;
      sounds.jump.play();
    }
  }

  draw() {
    let spriteSheet;
    switch (this.state) {
      case 'run':
        spriteSheet = this.sprites.run;
        break;
      case 'jump':
        spriteSheet = this.sprites.jump;
        break;
      case 'death':
        spriteSheet = this.sprites.death;
        break;
      case 'idle':
      default:
        spriteSheet = this.sprites.idle;
        break;
    }
    ctx.drawImage(spriteSheet[this.frame], this.x, this.y, this.width, this.height);
  }
}

// Collectible class
class Collectible {
  constructor(x, y, imgSrc) {
    this.width = 60;
    this.height = 60;
    this.x = x;
    this.y = y;
    this.img = new Image();
    this.img.src = imgSrc;
    this.collected = false;
  }

  draw() {
    if (!this.collected) {
      ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
  }

  getRect() {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }
}

// Obstacle class
class Obstacle {
  constructor(x, y, imgSrc, speed) {
    this.width = 90;
    this.height = 90;
    this.x = x;
    this.y = y;
    this.speed = speed || 6;
    this.img = new Image();
    this.img.src = imgSrc;
  }

  update() {
    this.x -= this.speed;
    if (this.x + this.width < 0) {
      this.x = CANVAS_WIDTH + Math.random() * 300 + 100;
    }
  }

  draw() {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }

  getRect() {
    return {x: this.x, y: this.y, width: this.width, height: this.height};
  }
}

// Utility for collision detection
function isColliding(rect1, rect2) {
  return !(
    rect1.x > rect2.x + rect2.width ||
    rect1.x + rect1.width < rect2.x ||
    rect1.y > rect2.y + rect2.height ||
    rect1.y + rect1.height < rect2.y
  );
}

// Game variables
const player = new Player();
const collectibles = [];
const obstacles = [];
const collectibleTypes = [
  './assets/images/dress/1.png',
  './assets/images/heels/1.png',
  './assets/images/handbag/1.png',
  './assets/images/earings/1.png',
];
const obstacleTypes = [
  './assets/images/obstacle_cart/1.png',
  './assets/images/obstacle_bag/1.png',
  './assets/images/obstacle_hanger/1.png',
];

// Spawn collectibles at random positions
function spawnCollectibles() {
  collectibles.length = 0;
  for (let i = 0; i < 6; i++) {
    const x = CANVAS_WIDTH + i * 250;
    const y = CANVAS_HEIGHT - 150 - Math.random() * 200;
    const imgSrc = collectibleTypes[i % collectibleTypes.length];
    collectibles.push(new Collectible(x, y, imgSrc));
  }
}

// Spawn obstacles at random positions
function spawnObstacles() {
  obstacles.length = 0;
  for (let i = 0; i < 4; i++) {
    const x = CANVAS_WIDTH + i * 400;
    const y = CANVAS_HEIGHT - 130;
    const imgSrc = obstacleTypes[i % obstacleTypes.length];
    obstacles.push(new Obstacle(x, y, imgSrc));
  }
}

// Game state
let keys = {};

// Handle keyboard input
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    player.jump();
  }
});
window.addEventListener('keyup', e => {
  keys[e.code] = false;
});

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Update player
  player.update();

  // Draw player
  player.draw();

  // Update and draw collectibles
  collectibles.forEach(collectible => {
    collectible.draw();
    if (!collectible.collected && isColliding(player, collectible.getRect())) {
      collectible.collected = true;
      score += 10;
      sounds.collect.play();
    }
  });

  // Update and draw obstacles
  obstacles.forEach(obstacle => {
    obstacle.update();
    obstacle.draw();
    if (isColliding(player, obstacle.getRect())) {
      sounds.death.play();
      endGame();
    }
  });

  // Display score
  scoreDisplay.textContent = `Score: ${score}`;

  // Request next frame
  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

// Start game function
function startGame() {
  gameRunning = true;
  score = 0;
  player.x = 100;
  player.y = CANVAS_HEIGHT - player.height - 60;
  player.velY = 0;
  player.grounded = true;
  player.state = 'run';
  spawnCollectibles();
  spawnObstacles();
  sounds.game.play();

  // Hide UI elements
  gameUI.classList.add('hidden');

  // Start loop
  gameLoop();
}

// End game function
function endGame() {
  gameRunning = false;
  player.state = 'death';
  sounds.game.pause();
  gameUI.classList.remove('hidden');
  alert(`Game Over! Your score: ${score}`);
}

// Event listeners
startBtn.addEventListener('click', () => {
  sounds.start.play();
  setTimeout(startGame, 1000);
});

shopBtn.addEventListener('click', () => {
  window.location.href = 'https://auragnal.com';
});

// Prevent scrolling on spacebar
window.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
  }
});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1440;
canvas.height = 1080;

let gameStarted = false;
let gameOver = false;

let score = 0;
let gravity = 0.7;

const assetsPath = './assets/';
const imagesPath = assetsPath + 'images/';
const soundsPath = assetsPath + 'sounds/';

// Load sounds
const sounds = {
  start: new Audio(soundsPath + 'start.mp3'),
  collect: new Audio(soundsPath + 'collect.ogg'),
  jump: new Audio(soundsPath + 'jump.wav'),
  death: new Audio(soundsPath + 'death.wav'),
  message: new Audio(soundsPath + 'message.wav'),
  game: new Audio(soundsPath + 'game.wav'),
};

sounds.game.loop = true;

// Load background image
const bgImage = new Image();
bgImage.src = imagesPath + 'bg.jpg';

// Player sprite frames (assumes 32 frames per animation)
const playerSprites = {
  idle: [],
  run: [],
  jump: [],
  death: [],
};

// Preload player frames helper
function loadPlayerSprites() {
  ['idle', 'run', 'jump', 'death'].forEach(action => {
    for (let i = 1; i <= 32; i++) {
      let img = new Image();
      img.src = `${assetsPath}player/${action}/${i}.png`;
      playerSprites[action].push(img);
    }
  });
}

loadPlayerSprites();

class Player {
  constructor() {
    this.x = 150;
    this.y = canvas.height - 300;
    this.width = 150;
    this.height = 220;
    this.vy = 0;
    this.onGround = false;
    this.frameIndex = 0;
    this.frameTick = 0;
    this.frameSpeed = 4;
    this.currentAction = 'idle';
    this.dead = false;
  }

  update() {
    if (this.dead) {
      this.currentAction = 'death';
    } else if (!this.onGround) {
      this.currentAction = 'jump';
    } else if (this.vy === 0) {
      this.currentAction = 'idle';
    } else {
      this.currentAction = 'run';
    }

    this.vy += gravity;
    this.y += this.vy;

    if (this.y + this.height >= canvas.height - 100) {
      this.y = canvas.height - 100 - this.height;
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    this.frameTick++;
    if (this.frameTick >= this.frameSpeed) {
      this.frameIndex = (this.frameIndex + 1) % playerSprites[this.currentAction].length;
      this.frameTick = 0;
    }
  }

  draw() {
    const frame = playerSprites[this.currentAction][this.frameIndex];
    if (frame.complete) {
      ctx.drawImage(frame, this.x, this.y, this.width, this.height);
    }
  }

  jump() {
    if (this.onGround && !this.dead) {
      this.vy = -20;
      this.onGround = false;
      sounds.jump.play();
    }
  }

  die() {
    this.dead = true;
    sounds.death.play();
    gameOver = true;
    sounds.game.pause();
  }
}

// Collectible class
class Collectible {
  constructor(type, x, y) {
    this.type = type; // e.g. 'dress', 'heels', 'handbag', 'earings'
    this.x = x;
    this.y = y;
    this.width = 100;
    this.height = 100;
    this.speed = 6;
    this.image = new Image();
    this.image.src = `${imagesPath}${type}/${Math.floor(Math.random() * 5) + 1}.png`; // random collectible image
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }
}

// Obstacle class
class Obstacle {
  constructor(type, x, y) {
    this.type = type; // e.g. 'obstacle_bag', 'obstacle_cart', 'obstacle_hanger'
    this.x = x;
    this.y = y;
    this.width = 120;
    this.height = 120;
    this.speed = 8;
    this.image = new Image();
    this.image.src = `${imagesPath}${type}/${Math.floor(Math.random() * 3) + 1}.png`;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    if (this.image.complete) {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
  }
}

let player = new Player();
let collectibles = [];
let obstacles = [];

let spawnTimer = 0;
let spawnInterval = 90;

function resetGame() {
  score = 0;
  gameOver = false;
  collectibles = [];
  obstacles = [];
  player = new Player();
  sounds.game.currentTime = 0;
  sounds.game.play();
}

// Handle collisions
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.height + rect1.y > rect2.y
  );
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background
  if (bgImage.complete) {
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
  }

  if (!gameStarted) {
    ctx.fillStyle = 'gold';
    ctx.font = '60px Cinzel Decorative, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Welcome Mystery Shopper', canvas.width / 2, canvas.height / 2 - 100);
    ctx.font = '30px Cormorant Garamond, serif';
    ctx.fillText('Shop Like A Wealthy, Play Like A Stealthy', canvas.width / 2, canvas.height / 2 - 50);
    return;
  }

  player.update();
  player.draw();

  spawnTimer++;
  if (spawnTimer > spawnInterval) {
    spawnTimer = 0;
    // Randomly spawn collectibles or obstacles
    let spawnType = Math.random() < 0.6 ? 'collectible' : 'obstacle';

    if (spawnType === 'collectible') {
      const types = ['dress', 'heels', 'handbag', 'earings'];
      let type = types[Math.floor(Math.random() * types.length)];
      let yPos = canvas.height - 150 - Math.random() * 150; // random height above ground
      collectibles.push(new Collectible(type, canvas.width, yPos));
    } else {
      const types = ['obstacle_bag', 'obstacle_cart', 'obstacle_hanger'];
      let type = types[Math.floor(Math.random() * types.length)];
      let yPos = canvas.height - 150;
      obstacles.push(new Obstacle(type, canvas.width, yPos));
    }
  }

  // Update and draw collectibles
  collectibles.forEach((item, index) => {
    item.update();
    item.draw();

    if (checkCollision(player, item)) {
      score += 10;
      sounds.collect.play();
      collectibles.splice(index, 1);
    }

    // Remove collectibles off screen
    if (item.x + item.width < 0) {
      collectibles.splice(index, 1);
    }
  });

  // Update and draw obstacles
  obstacles.forEach((obs, index) => {
    obs.update();
    obs.draw();

    if (checkCollision(player, obs)) {
      player.die();
    }

    // Remove obstacles off screen
    if (obs.x + obs.width < 0) {
      obstacles.splice(index, 1);
    }
  });

  // Draw score
  ctx.fillStyle = 'gold';
  ctx.font = '40px Cinzel Decorative, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 30, 60);

  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'gold';
    ctx.font = '80px Cinzel Decorative, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '40px Cormorant Garamond, serif';
    ctx.fillText('Final Score: ' + score, canvas.width / 2, canvas.height / 2 + 40);
  }

  requestAnimationFrame(gameLoop);
}

// Controls
document.getElementById('startBtn').addEventListener('click', () => {
  if (!gameStarted) {
    resetGame();
    gameStarted = true;
  }
});

document.getElementById('shopBtn').addEventListener('click', () => {
  window.location.href = 'https://auragnal.com';
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    player.jump();
  }
});

// For touch devices, tap canvas to jump
canvas.addEventListener('touchstart', () => {
  player.jump();
});

gameLoop();

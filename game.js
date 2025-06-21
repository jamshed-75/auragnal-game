let canvas, ctx;
let gameStarted = false;
let player = {
  x: 100,
  y: 300,
  width: 50,
  height: 50,
  frame: 0,
  currentAnimation: 'idle',
  animations: {
    idle: [],
    run: [],
    jump: [],
    death: []
  }
};
let keys = {};
let bgMusic, jumpSound, collectSound, deathSound;
let collectibles = [];
let obstacles = [];
let score = 0;
let gravity = 0.8;
let velocityY = 0;
let isJumping = false;

// Preload all assets
function preloadAssets() {
  // Load player animations
  const actions = ['idle', 'run', 'jump', 'death'];
  actions.forEach(action => {
    for (let i = 1; i <= 32; i++) {
      let img = new Image();
      img.src = `./assets/player/${action}/${i}.png`;
      player.animations[action].push(img);
    }
  });

  // Load sounds
  bgMusic = new Audio('./assets/sounds/game.wav');
  jumpSound = new Audio('./assets/sounds/jump.wav');
  collectSound = new Audio('./assets/sounds/collect.ogg');
  deathSound = new Audio('./assets/sounds/death.wav');
}

function startGame() {
  document.getElementById('startBtn').style.display = 'none';
  bgMusic.loop = true;
  bgMusic.volume = 0.4;
  bgMusic.play();
  gameStarted = true;
  requestAnimationFrame(gameLoop);
}

function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = 1440;
  canvas.height = 810;

  // Resize canvas for responsiveness
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  preloadAssets();

  document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
    if (e.code === 'Space' && !isJumping) {
      isJumping = true;
      velocityY = -16;
      jumpSound.play();
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
}

function drawPlayer() {
  let anim = player.animations[player.currentAnimation];
  if (anim && anim[player.frame]) {
    ctx.drawImage(anim[player.frame], player.x, player.y, player.width, player.height);
  }
  player.frame = (player.frame + 1) % 32;
}

function updatePlayer() {
  // Gravity
  if (isJumping) {
    velocityY += gravity;
    player.y += velocityY;
    if (player.y >= 300) {
      player.y = 300;
      velocityY = 0;
      isJumping = false;
    }
  }
  if (keys['ArrowRight']) {
    player.x += 5;
    player.currentAnimation = 'run';
  } else {
    player.currentAnimation = isJumping ? 'jump' : 'idle';
  }
}

function drawHUD() {
  ctx.fillStyle = 'gold';
  ctx.font = '28px Cinzel Decorative';
  ctx.fillText(`Score: ${score}`, 30, 40);
}

function gameLoop() {
  if (!gameStarted) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  drawPlayer();
  drawHUD();

  requestAnimationFrame(gameLoop);
}

window.onload = init;
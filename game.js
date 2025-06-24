// Game Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById("startBtn");
const letsShopBtn = document.getElementById("lets-shop");
const muteBtn = document.getElementById("muteBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");

let gameStarted = false;
let gameOver = false;
let isMuted = false;
let score = 0;
let highestScore = localStorage.getItem("highestScore") || 0;
let gameSpeed = 4;
let frameCount = 0;

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

let cartFrames = [
  "cart_empty.png",
  "cart_partial.png",
  "cart_full.png",
  "cart_broken.png"
].map(name => {
  const img = new Image();
  img.src = `assets/cart/${name}`;
  return img;
});

function setupCanvas() {
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
}
setupCanvas();

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

function playSound(sound) {
  if (!isMuted) {
    sounds[sound].currentTime = 0;
    sounds[sound].play();
  }
}

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
  if (isMuted) sounds.game.pause();
  else if (gameStarted) sounds.game.play();
});

// Player Class
class Player {
  constructor() {
    this.frameWidth = 64; // Adjust this based on your cart image width
    this.frameHeight = 64; // Adjust this based on your cart image height
    this.scale = 1.5; // Cart size slightly bigger than the obstacles
    this.x = 80;
    this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40; 
    this.dy = 0;
    this.jumpPower = -18;
    this.grounded = true;
    this.isDead = false;
    this.state = 0; // 0=empty, 1=partial, 2=full, 3=broken
  }

  update() {
    if (this.isDead) {
      this.state = 3; // Broken
    } else if (!this.grounded) {
      this.state = 2; // Full (can be adjusted based on the cart state)
    } else {
      this.state = 0; // Empty
    }

    this.dy += 1.2; // Gravity effect
    this.y += this.dy;

    if (this.y + this.frameHeight * this.scale >= CANVAS_HEIGHT - 40) {
      this.y = CANVAS_HEIGHT - this.frameHeight * this.scale - 40;
      this.dy = 0;
      this.grounded = true;
    } else {
      this.grounded = false;
    }
  }

  jump() {
    if (this.grounded && !this.isDead) {
      this.dy = this.jumpPower;
      this.grounded = false;
      playSound("jump");
    }
  }

  die() {
    this.isDead = true;
    playSound("death");
  }

  draw() {
    const img = cartFrames[this.state];
    if (!img.complete) return;

    ctx.drawImage(
      img,
      0, 0,
      this.frameWidth,
      this.frameHeight,
      this.x,
      this.y,
      this.frameWidth * this.scale,
      this.frameHeight * this.scale
    );
  }
}

// Game Loop
const player = new Player();

function drawScore() {
  ctx.font = "20px Cinzel Decorative, cursive";
  ctx.fillStyle = "#588749";
  ctx.fillText(`Score: ${score}`, 40, 40);
  ctx.fillText(`Highest: ${highestScore}`, 40, 70);
}

function drawBackground() {
  const bgImage = new Image();
  bgImage.src = "assets/images/bg_loop.png";
  bgImage.onload = () => {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(bgImage, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(bgImage, CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  };
}

function gameLoop() {
  if (gameOver) {
    drawScore();
    return;
  }

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();

  player.update();
  player.draw();

  drawScore();
  frameCount++;
  requestAnimationFrame(gameLoop);
}

// Controls
startBtn.addEventListener("click", () => {
  if (!gameStarted) {
    gameStarted = true;
    playSound("start");
  }
  resetGame();
});

function resetGame() {
  gameOver = false;
  score = 0;
  gameSpeed = 4;
  player.y = CANVAS_HEIGHT - player.frameHeight * player.scale - 40;
  player.dy = 0;
  player.isDead = false;
  tryAgainBtn.style.display = "none"; // Hide Try Again button
  playSound("game");
  requestAnimationFrame(gameLoop);
}

tryAgainBtn.addEventListener("click", resetGame);
muteBtn.addEventListener("click", () => { isMuted = !isMuted; });

// Increase Game Speed after 50 Score
function increaseSpeed() {
  if (score % 50 === 0) {
    gameSpeed += 0.5;
  }
}

// Handle Jump and Stop Buttons for future obstacle falls
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") player.jump();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  // Implement Stop Button Functionality when falling obstacles are added
});

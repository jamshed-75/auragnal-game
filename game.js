const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = {
  x: 100,
  y: 600,
  width: 80,
  height: 80,
  speed: 5,
  vy: 0,
  jumpPower: 15,
  grounded: false,
};

let gravity = 0.8;
let isGameRunning = false;
let bgImage = new Image();
bgImage.src = "assets/images/bg.jpg";

let collectible = {
  x: 600,
  y: 600,
  width: 60,
  height: 60,
  image: new Image()
};
collectible.image.src = "assets/images/dress/1.png";

let obstacle = {
  x: 900,
  y: 600,
  width: 60,
  height: 60,
  image: new Image()
};
obstacle.image.src = "assets/images/obstacle_cart/1.png";

const keys = {};

document.addEventListener("keydown", e => keys[e.key] = true);
document.addEventListener("keyup", e => keys[e.key] = false);

document.getElementById("startButton").addEventListener("click", () => {
  if (!isGameRunning) {
    playSound("start");
    isGameRunning = true;
    gameLoop();
  }
});

function playSound(name) {
  const sound = new Audio(`assets/sounds/${name}.mp3`);
  sound.play();
}

function gameLoop() {
  if (!isGameRunning) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  // Controls
  if (keys["ArrowRight"]) player.x += player.speed;
  if (keys["ArrowLeft"]) player.x -= player.speed;
  if (keys[" "]) {
    if (player.grounded) {
      player.vy = -player.jumpPower;
      player.grounded = false;
      playSound("jump");
    }
  }

  // Apply gravity
  player.vy += gravity;
  player.y += player.vy;

  // Ground collision
  if (player.y + player.height >= canvas.height) {
    player.y = canvas.height - player.height;
    player.vy = 0;
    player.grounded = true;
  }

  // Draw player
  ctx.fillStyle = "yellow";
  ctx.beginPath();
  ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 40, 0, Math.PI * 2);
  ctx.fill();

  // Draw collectible
  ctx.drawImage(collectible.image, collectible.x, collectible.y, collectible.width, collectible.height);

  // Draw obstacle
  ctx.drawImage(obstacle.image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

  requestAnimationFrame(gameLoop);
}
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const FRAME_RATE = 10; // Adjust for animation speed
let frameTimer = 0;

canvas.width = 1280;
canvas.height = 720;

let gameRunning = false;
let gameOver = false;
let mute = false;

const GRAVITY = 1;
const JUMP_STRENGTH = -18;

const player = {
  x: 100,
  y: 0,
  width: 117,
  height: 296,
  velocityY: 0,
  frameIndex: 0,
  currentAnimation: "idle",
  animations: {
    idle: [],
    run: [],
    jump: [],
    death: [],
  },
  frameDelay: 0,

  update() {
    if (this.currentAnimation === "jump") {
      this.velocityY += GRAVITY;
      this.y += this.velocityY;

      if (this.y >= canvas.height - this.height - 40) {
        this.y = canvas.height - this.height - 40;
        this.velocityY = 0;
        this.setAnimation("run");
      }
    }

    this.frameDelay++;
    if (this.frameDelay >= FRAME_RATE) {
      this.frameDelay = 0;
      this.frameIndex = (this.frameIndex + 1) % this.animations[this.currentAnimation].length;
    }
  },

  draw() {
    const frame = this.animations[this.currentAnimation][this.frameIndex];
    if (frame.complete) {
      ctx.drawImage(frame, this.x, this.y, this.width, this.height);
    }
  },

  jump() {
    if (this.currentAnimation !== "jump") {
      this.velocityY = JUMP_STRENGTH;
      this.setAnimation("jump");
    }
  },

  setAnimation(name) {
    if (this.currentAnimation !== name) {
      this.currentAnimation = name;
      this.frameIndex = 0;
    }
  },
};

// Load images per frame
function loadPlayerFrames() {
  const types = ["idle", "run", "jump", "death"];
  const counts = {
    idle: 3,
    run: 4,
    jump: 4,
    death: 2,
  };

  types.forEach((type) => {
    for (let i = 1; i <= counts[type]; i++) {
      const img = new Image();
      img.src = `assets/player/${type}/${type}${i}.png`;
      player.animations[type].push(img);
    }
  });
}

function drawBackground() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop() {
  if (!gameRunning) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();

  player.update();
  player.draw();

  requestAnimationFrame(gameLoop);
}

document.getElementById("startBtn").addEventListener("click", () => {
  if (!gameRunning) {
    gameRunning = true;
    player.setAnimation("run");
    gameLoop();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    player.jump();
  }
});

document.getElementById("muteBtn").addEventListener("click", () => {
  mute = !mute;
  document.getElementById("muteBtn").innerText = mute ? "🔇" : "🔊";
});

loadPlayerFrames();

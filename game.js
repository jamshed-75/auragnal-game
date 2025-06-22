window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const container = document.getElementById("game-container");

  if (!canvas || !container) {
    console.error("Canvas or container not found!");
    return;
  }

  function resizeCanvas() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Launch the game logic after setup
  initGame(canvas);
});

function initGame(canvas) {
  const ctx = canvas.getContext("2d");

  const startBtn = document.getElementById("startBtn");
  const gameTitle = document.getElementById("game-title");
  const letsShopBtn = document.getElementById("lets-shop");
  const muteBtn = document.getElementById("muteBtn");

  let gameStarted = false;
  let gameOver = false;
  let score = 0;
  let gameSpeed = 5;
  let gravity = 1.5;
  let frameCount = 0;
  let isMuted = false;

  // Load Sounds
  const sounds = {
    start: new Audio("assets/sound/start.mp3"),
    collect: new Audio("assets/sound/collect.ogg"),
    jump: new Audio("assets/sound/jump.wav"),
    death: new Audio("assets/sound/death.wav"),
    message: new Audio("assets/sound/message.wav"),
    game: new Audio("assets/sound/game.wav"),
  };
  sounds.game.loop = true;

  function toggleMute() {
    isMuted = !isMuted;
    Object.values(sounds).forEach((sound) => {
      sound.muted = isMuted;
    });
    muteBtn.textContent = isMuted ? "🔇" : "🔊";
  }

  muteBtn.addEventListener("click", toggleMute);

  // Player Sprites (each sprite is 5x4 or 6x5 etc)
  class SpriteAnimation {
    constructor(imageSrc, frameCols, frameRows, frameSpeed = 4) {
      this.image = new Image();
      this.image.src = imageSrc;
      this.frameCols = frameCols;
      this.frameRows = frameRows;
      this.frameSpeed = frameSpeed;
      this.frameWidth = 0;
      this.frameHeight = 0;
      this.totalFrames = frameCols * frameRows;
      this.currentFrame = 0;
      this.frameTimer = 0;

      this.image.onload = () => {
        this.frameWidth = this.image.width / this.frameCols;
        this.frameHeight = this.image.height / this.frameRows;
      };
    }

    update() {
      this.frameTimer++;
      if (this.frameTimer >= this.frameSpeed) {
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
        this.frameTimer = 0;
      }
    }

    draw(ctx, x, y, scale = 1.8) {
      const col = this.currentFrame % this.frameCols;
      const row = Math.floor(this.currentFrame / this.frameCols);
      ctx.drawImage(
        this.image,
        col * this.frameWidth,
        row * this.frameHeight,
        this.frameWidth,
        this.frameHeight,
        x,
        y,
        this.frameWidth * scale,
        this.frameHeight * scale
      );
    }
  }

  const playerAnimations = {
    idle: new SpriteAnimation("assets/player/idle/sprite.png", 4, 4),
    run: new SpriteAnimation("assets/player/run/sprite.png", 5, 4),
    jump: new SpriteAnimation("assets/player/jump/sprite.png", 6, 4),
    death: new SpriteAnimation("assets/player/death/sprite.png", 6, 5),
  };

  class Player {
    constructor() {
      this.scale = 1.8;
      this.x = 80;
      this.y = canvas.height - 150;
      this.dy = 0;
      this.jumpPower = -22;
      this.grounded = true;
      this.state = "idle";
    }

    get width() {
      return playerAnimations[this.state].frameWidth * this.scale;
    }

    get height() {
      return playerAnimations[this.state].frameHeight * this.scale;
    }

    update() {
      this.dy += gravity;
      this.y += this.dy;

      if (this.y + this.height >= canvas.height - 40) {
        this.y = canvas.height - this.height - 40;
        this.dy = 0;
        this.grounded = true;
        if (this.state === "jump") this.state = "run";
      } else {
        this.grounded = false;
      }

      playerAnimations[this.state].update();
    }

    jump() {
      if (this.grounded) {
        this.dy = this.jumpPower;
        this.grounded = false;
        this.state = "jump";
        if (!isMuted) sounds.jump.play();
      }
    }

    draw() {
      playerAnimations[this.state].draw(ctx, this.x, this.y, this.scale);
    }
  }

  class GameObject {
    constructor(imgSrc, width, height, speed) {
      this.image = new Image();
      this.image.src = imgSrc;
      this.width = width;
      this.height = height;
      this.x = canvas.width + Math.random() * 300;
      this.y = canvas.height - height - 40;
      this.speed = speed;
      this.markedForDeletion = false;
    }

    update() {
      this.x -= this.speed;
      if (this.x + this.width < 0) this.markedForDeletion = true;
    }

    draw() {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    collidesWith(player) {
      return !(
        player.x > this.x + this.width ||
        player.x + player.width < this.x ||
        player.y > this.y + this.height ||
        player.y + player.height < this.y
      );
    }
  }

  const player = new Player();

  const collectibleImages = [
    "assets/images/dress.png",
    "assets/images/heels.png",
    "assets/images/handbag.png",
    "assets/images/earing.png",
  ];

  const obstacleImages = [
    "assets/images/obstacle_cart.png",
    "assets/images/obstacle_bag.png",
    "assets/images/obstacle_hanger.png",
  ];

  let collectibles = [];
  let obstacles = [];

  function spawnCollectible() {
    const imgSrc = collectibleImages[Math.floor(Math.random() * collectibleImages.length)];
    collectibles.push(new GameObject(imgSrc, 40, 40, gameSpeed));
  }

  function spawnObstacle() {
    const imgSrc = obstacleImages[Math.floor(Math.random() * obstacleImages.length)];
    obstacles.push(new GameObject(imgSrc, 50, 50, gameSpeed));
  }

  function drawScore() {
    ctx.font = "bold 24px Cinzel Decorative";
    ctx.fillStyle = "gold";
    ctx.fillText(`Score: ${score}`, 20, 40);
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "gold";
    ctx.font = "48px Cinzel Decorative";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "24px Cinzel Decorative";
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2);
    ctx.fillText("Tap to try again", canvas.width / 2, canvas.height / 2 + 40);
  }

  function resetGame() {
    score = 0;
    gameSpeed = 5;
    collectibles = [];
    obstacles = [];
    frameCount = 0;
    player.y = canvas.height - player.height - 40;
    player.dy = 0;
    player.state = "run";
    gameOver = false;
    sounds.game.currentTime = 0;
    if (!isMuted) sounds.game.play();
    gameTitle.style.display = "none";
    startBtn.style.display = "none";
    letsShopBtn.style.display = "none";
    gameLoop();
  }

  function gameLoop() {
    if (gameOver) {
      drawGameOver();
      sounds.game.pause();
      if (!isMuted) sounds.death.play();
      canvas.addEventListener("click", resetGame, { once: true });
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update();
    player.draw();

    if (frameCount % 120 === 0) spawnCollectible();
    if (frameCount % 160 === 0) spawnObstacle();

    collectibles.forEach((col, i) => {
      col.update();
      col.draw();
      if (col.collidesWith(player)) {
        score += 10;
        if (!isMuted) sounds.collect.play();
        collectibles.splice(i, 1);
      }
    });

    obstacles.forEach((obs, i) => {
      obs.update();
      obs.draw();
      if (obs.collidesWith(player)) {
        gameOver = true;
      }
    });

    collectibles = collectibles.filter(c => !c.markedForDeletion);
    obstacles = obstacles.filter(o => !o.markedForDeletion);

    if (frameCount % 500 === 0) gameSpeed += 0.5;

    drawScore();
    frameCount++;
    requestAnimationFrame(gameLoop);
  }

  function handleKeyDown(e) {
    if (e.code === "Space" || e.code === "ArrowUp") {
      player.jump();
    }
  }

  function handleTouchStart() {
    player.jump();
  }

  startBtn.addEventListener("click", () => {
    if (!gameStarted) {
      gameStarted = true;
      if (!isMuted) sounds.start.play();
      resetGame();
    }
  });

  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("touchstart", handleTouchStart);
}

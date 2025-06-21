
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let img = new Image();
img.src = './assets/mystery_shopper_idle.png';

img.onload = () => {
  ctx.fillStyle = "#FFF";
  ctx.font = "30px Arial";
  ctx.fillText("Welcome Mystery Shopper", 500, 400);
  ctx.drawImage(img, 680, 500, 80, 80);
};

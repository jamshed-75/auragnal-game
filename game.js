
window.onload = function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const bg = new Image();
  bg.src = 'assets/images/bg.jpg';

  bg.onload = () => {
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 48px sans-serif";
    ctx.fillText("Welcome Mystery Shopper", 400, 100);
    ctx.fillStyle = "gold";
    ctx.font = "36px sans-serif";
    ctx.fillText("SHOP LIKE A WEALTHY, PLAY LIKE A STEALTHY", 280, 160);
  };

  document.getElementById('shopBtn').addEventListener('click', () => {
    window.location.href = "https://jyxc86-ji.myshopify.com";
  });
};

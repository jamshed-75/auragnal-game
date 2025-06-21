* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Cormorant Garamond', serif;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

#game-container {
  position: relative;
  width: 90vw;
  max-width: 1440px;
  aspect-ratio: 16 / 9;
  background-color: #000;
  box-shadow: 0 0 25px gold;
  border: 4px solid gold;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

#start-screen {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url('./assets/images/bg.jpg') no-repeat center center / cover;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

h1 {
  color: gold;
  font-size: 2.5rem;
  margin-bottom: 20px;
  text-shadow: 0 0 10px #ffd700aa;
}

button {
  padding: 14px 28px;
  margin: 10px;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s ease;
  background: #1a1a1a;
  color: gold;
  box-shadow: 0 0 10px gold;
}

button:hover {
  background: gold;
  color: black;
}

#shop-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 15;
  background-color: #1a1a1a;
  color: gold;
  font-size: 1rem;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px gold;
}
const socket = io();
const canvas = document.getElementById("squashGame");
const ctx = canvas.getContext("2d");
const serveBtn = document.getElementById("serveBtn");

let player = null;
let gameState = null;
let gameStarted = false;

// Draw functions
function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawText(text, x, y, color, size = "20px") {
    ctx.fillStyle = color;
    ctx.font = `${size} Arial`;
    ctx.fillText(text, x, y);
}

// Socket listeners
socket.on("playerType", (data) => {
    player = data;
    alert(`You are ${player === 'left' ? 'Left Player (Red)' : 'Right Player (Blue)'}`);
});

socket.on("gameState", (state) => {
    gameState = state;
    gameStarted = state.gameStarted;
    drawGame();
});

// Draw game
function drawGame() {
    if (!gameState) return;

    // Clear canvas
    drawRect(0, 0, canvas.width, canvas.height, "black");

    // Draw paddles (positioned next to each other on left)
    drawRect(gameState.left.x, gameState.left.y, 10, 100, "red");
    drawRect(gameState.right.x, gameState.right.y, 10, 100, "blue");

    // Draw ball
    drawCircle(gameState.ball.x, gameState.ball.y, gameState.ball.radius, "white");

    // Draw front wall (right side)
    drawRect(790, 0, 10, canvas.height, "white");

    // Draw scores
    drawText(`Left: ${gameState.left.score}`, 50, 30, "red");
    drawText(`Right: ${gameState.right.score}`, 650, 30, "blue");

    // Show turn indicator
    drawText(`${gameState.turn === 'left' ? 'Left' : 'Right'} Player's Turn`, 350, 30, "white");

    // Show waiting or serve messages
    if (!gameState.gameStarted) {
        drawText("Waiting for both players to start...", 200, 250, "yellow", "24px");
    } else if (!gameState.gameActive) {
        drawText(`${gameState.turn === 'left' ? 'Left' : 'Right'} Player to Serve`, 300, 250, "yellow", "24px");
        serveBtn.style.display = "block";
    } else {
        serveBtn.style.display = "none";
    }
}

// Event listeners
document.addEventListener("keydown", (event) => {
    if (!player || !gameState || !gameState.gameActive) return;

    let move = { player, direction: event.key };
    socket.emit("movePaddle", move);
});

document.getElementById("startGameBtn").addEventListener("click", () => {
    socket.emit("startGame");
});

serveBtn.addEventListener("click", () => {
    if (player === gameState?.turn) {
        socket.emit("serveBall");
    } else {
        alert("Wait for your turn to serve!");
    }
});